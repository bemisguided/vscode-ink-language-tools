Welcome to the test story! #welcome

You find yourself in a mysterious forest. What do you want to do?

* [Look around] -> look_around
* [Walk forward] -> walk_forward  
* [Call for help] -> call_help

=== look_around ===
You look around and see tall trees and mysterious shadows. #observation

The forest seems endless in all directions.

* [Continue walking] -> walk_forward
* [Sit and rest] -> rest

=== walk_forward ===
You walk deeper into the forest. #walking

After a while, you find a small clearing with a fountain.

* [Drink from fountain] -> drink_fountain
* [Examine fountain] -> examine_fountain

=== call_help ===
You call for help, but only hear your echo. #calling

No one seems to be around to help you.

* [Keep walking] -> walk_forward
* [Look around more carefully] -> look_around

=== rest ===
You sit down and rest for a moment. #resting

The forest is peaceful and quiet.

-> END

=== drink_fountain ===
You drink from the fountain. The water is refreshing! #drinking

You feel energized and ready to continue your journey.

-> END

=== examine_fountain ===
You examine the fountain carefully. #examining

It's made of ancient stone with mysterious runes carved into it.

* [Touch the runes] -> touch_runes
* [Leave the fountain] -> END

=== touch_runes ===
As you touch the runes, they begin to glow! #magic

A portal opens up and you step through to safety.

-> END 