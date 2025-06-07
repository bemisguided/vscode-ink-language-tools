-> start

=== start ===
You enter a mysterious room. # location:chamber mood:tense
The walls are covered in ancient symbols. # atmosphere:mysterious

* [Examine the symbols] # action:investigate
    -> examine_symbols
* [Look for an exit] # action:escape 
    -> find_exit

=== examine_symbols ===
The symbols glow faintly as you approach. # effect:glow discovery:true
You feel a strange energy. # sensation:magical

* [Touch the symbols] # action:risky consequence:unknown
    -> touch_symbols
* [Step back carefully] # action:safe
    -> step_back

=== find_exit ===
You search the room but find no obvious exit. # result:failure
The symbols seem to be watching you. # feeling:paranoid

* [Return to examine symbols] # action:investigate
    -> examine_symbols

=== touch_symbols ===
The moment you touch them, the room transforms! # event:transformation
You are transported to another realm. # location:otherworld magic:true
-> END

=== step_back ===
You safely retreat from the glowing symbols. # action:safe result:survived
Perhaps there's another way. # thought:strategic
-> start 