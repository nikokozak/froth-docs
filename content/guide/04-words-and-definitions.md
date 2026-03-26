---
title: "Words and Definitions"
weight: 4
---

Every operation you have used so far is a word. `+` is a word. `.s` is a word. Even a bare number like `42` acts as a word whose only job is to push a value. The difference between using Froth and programming in Froth is that you start defining your own.

## What is a word?

A word is a named operation that transforms the stack. When you type a word at the REPL, Froth looks up its name, finds the code associated with it, and runs that code. The code might consume values, produce values, both, or neither. What matters is that every word has a predictable effect on the stack, and you can compose words by placing them next to each other.

You already know a handful of built-in words. `+` takes two values and leaves their sum. `.` takes one value and prints it. `.s` takes nothing and prints the entire stack without changing it. Each one is a small, self-contained transformation.

A Froth program grows by defining new words in terms of existing ones. You name a sequence of operations, and from that point on, the name stands in for the whole sequence. The blink example from the first chapter worked exactly this way: one word to set a GPIO pin high, one to wait, one to combine them into a pattern. Each word was short. Together, they described the full behavior.

## Your first definition

The syntax for defining a word is `: name body ;`. The colon opens the definition and is followed immediately by the name you're choosing. The body is one or more words that will run when the name is called. The semicolon closes the definition.

```froth
: double ( n -- n ) 2 * ;
```

Read this as: "Define a word called `double`. When called, it pushes 2 and then multiplies." The `( n -- n )` part is a stack effect comment. It says the word expects one value on the stack and leaves one value. More on that convention shortly.

Test it:

```froth
froth> : double ( n -- n ) 2 * ;
froth> 5 double .
10
froth> 3 double .
6
```

Here is what happened with `5 double .`:

1. `5` pushes 5 onto the stack. Stack: `[5]`
2. `double` runs its body: `2 *`. First `2` is pushed, giving `[5 2]`. Then `*` multiplies the top two values, leaving `[10]`.
3. `.` prints and consumes the top value. Output: `10`. Stack: `[]`

The word `double` is now part of your session. Type `words` and you will see it in the list alongside the built-in vocabulary.

## What `:` and `;` are shorthand for

The colon-semicolon syntax is convenient, but it is not the underlying mechanism. It is shorthand for two more primitive operations: a quotation and `def`.

A quotation is a block of code wrapped in `[` and `]`. It does not run when you type it. Instead, the block itself lands on the stack as a single value, ready to be executed later.

`def` takes two things from the stack: a quotation and a name. It binds the quotation to the name, creating a word.

The desugared form of `: double 2 * ;` is:

```froth
[ 2 * ] 'double def
```

Read this as: "Push the quotation `[ 2 * ]` onto the stack. Push the name `double`, quoted with `'` so Froth treats it as a name rather than looking it up. Call `def` to bind the quotation to that name."

The `'` (tick) prefix is important. Without it, writing `double def` would tell Froth to look up `double` and execute it. Tick says: "I mean the name itself, not whatever the name refers to."

Both forms produce exactly the same result. You can verify this by defining one word each way and checking that they behave identically:

```froth
froth> : double ( n -- n ) 2 * ;
froth> [ 3 * ] 'triple def
froth> 4 double .
8
froth> 4 triple .
12
```

The colon-semicolon form exists because it reads more naturally. You will use it for almost every definition. But knowing the desugared form matters, because it reveals something about Froth's design: a word is just a name bound to a quotation. Definitions are data.

## Slots: how Froth stores words

Every word name in Froth corresponds to a slot. A slot is a named container that holds a value. When you define a word with `def` (or with `: ;`, which calls `def`), Froth creates or updates the slot for that name and stores the quotation in it.

When you call a word, Froth finds the slot for that name and runs whatever is inside it *at the moment of the call*. Not at the moment the word was defined. Not a frozen copy from some earlier point. The current contents of the slot, right now.

This distinction matters as soon as one word uses another. Consider:

```froth
: double ( n -- n ) 2 * ;
: quadruple ( n -- n ) double double ;
```

After these definitions, two slots exist:

```
Slot: double           Slot: quadruple
┌──────────┐           ┌───────────────────┐
│  [ 2 * ] │     <──   │ [ double double ] │
└──────────┘           └───────────────────┘
```

The slot for `quadruple` does not contain a copy of `double`'s body. It contains the name `double`, twice. When `quadruple` runs, it looks up the `double` slot each time. The lookup always reflects whatever `double` currently holds.

## Calling words

When you type a word name in the REPL or use it inside a definition, Froth follows a simple process:

1. Look up the slot for that name.
2. If the slot holds a quotation, run it.
3. If the name has no slot, signal an error.

This lookup happens at call time, every time. You can inspect any word's current definition with `see`:

```froth
froth> see double
: double ( n -- n ) 2 * ;
```

The output is the definition reconstructed from the stored quotation.

## Redefining words

Here is where the slot model pays off. Define `double` and `quadruple`:

```froth
froth> : double ( n -- n ) 2 * ;
froth> : quadruple ( n -- n ) double double ;
froth> 3 quadruple .
12
```

`3 quadruple` calls `double` twice: 3 becomes 6, then 6 becomes 12. The arithmetic checks out.

Now redefine `double`. Give it a different body, but keep the same name:

```froth
froth> : double ( n -- n ) 3 * ;
```

Call `quadruple` again, without changing its definition:

```froth
froth> 3 quadruple .
27
```

The result is 27, not 12. `quadruple` was not redefined. Its body still says `double double`. But when it runs, it looks up the `double` slot, and that slot now holds `[ 3 * ]`. So `quadruple` calls the new `double`: 3 becomes 9, then 9 becomes 27.

This is coherent redefinition. When you change a word, every word that calls it immediately reflects the change. You do not need to reload anything. You do not need to redefine the callers. The slot lookup guarantees that references always point to the latest version.

In traditional Forth, this does not happen. Forth compiles a direct reference to `double`'s body into `quadruple` at the moment `quadruple` is defined. If you later redefine `double`, the old callers still use the old body. The new definition and the old callers silently disagree, and the resulting bugs are hard to track down.

Froth's approach eliminates that class of problem. At the REPL, where you are constantly revising and testing, coherent redefinition means you can change a helper function and immediately test the higher-level word that depends on it. The feedback loop stays short.

## Stack effect comments

The `( inputs -- outputs )` comment inside a definition is a convention, not something the language enforces. You can omit it and the word will compile and run the same way. But writing stack effects is worth the few extra keystrokes.

A stack effect comment forces you to state what your word expects and what it promises. When you write `( n -- n )`, you are committing to: "this word takes one value and leaves one value." Someone reading your code, including you six months from now, can understand the interface without reading the body.

The convention for labels:

- Use short, descriptive names. `n` for a generic number, `a b` for two numbers, `flag` for a boolean, `addr` for a memory address.
- If the result has a meaningful name, use it: `( n -- doubled )` or `( a b -- sum )`.
- Write the stack effect right after the word name, before the body.

```froth
: increment ( n -- n ) 1 + ;
: add ( a b -- sum ) + ;
: print-top ( n -- ) . ;
```

The VSCode extension reads these comments to display inline hints as you type. Getting into the habit now pays off as your programs grow.

## Exercises

**Exercise 1.** Define `: triple ( n -- n ) 3 * ;` and test it.

- What does `4 triple .` print?
- What does `2 triple triple .` print?

**Exercise 2.** Define `triple` as above. Then define `: sextuple ( n -- n ) triple triple ;`.

- What does `2 sextuple .` print?
- Redefine `triple` as `: triple ( n -- n ) 4 * ;`. What does `2 sextuple .` print now, without redefining `sextuple`?
- If you expected the answer to stay the same, think about what `sextuple` looks up when it runs.

**Exercise 3.** Write the correct stack effect comment for each of these definitions:

- `: increment ( ? ) 1 + ;`
- `: add3 ( ? ) + + ;`
- `: print-and-discard ( ? ) . ;`

**Exercise 4.** Define any word, then run `see` on it. Verify that the output matches what you defined.

Each value on the stack can only be used once, because the word that consumes it removes it. If you have found yourself wanting to use the same value twice in one word body, the next chapter introduces `perm`, which gives you control over exactly that problem.

[Previous: The Stack](03-the-stack.md) | [Next: Perm and Named](05-perm-and-named.md)
