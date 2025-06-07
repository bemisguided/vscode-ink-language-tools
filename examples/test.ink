// Test file for Ink syntax highlighting
/* 
   Multi-line comment to test
   comment highlighting
*/

INCLUDE characters.ink

VAR player_health = 100
CONST MAX_HEALTH = 100
LIST inventory = sword, (shield), potion

=== start ===
You stand at the entrance to a dark dungeon. Your health is {player_health}.

{describe_character("alice")}

{inventory ? sword: You grip your sword tightly.}

* [Enter the dungeon] -> dungeon_entrance
* {player_health < MAX_HEALTH} [Drink a potion first] -> drink_potion
+ [Examine your equipment] -> check_inventory

=== dungeon_entrance ===
The corridor stretches ahead, lit by flickering torches.

~ temp courage = 50

{courage > 30:
    You steel yourself and move forward.
- else:
    Fear grips you, but you press on anyway.
}

* [Take the left path] -> left_path
* [Take the right path] -> right_path
- -> continue_deeper

=== function calculate_damage(base_damage, armor) ===
~ temp final_damage = base_damage - armor
{final_damage < 0:
    ~ final_damage = 0
}
~ return final_damage

=== drink_potion ===
You drink a healing potion. # healing_sound
~ player_health += 25
{player_health > MAX_HEALTH: ~ player_health = MAX_HEALTH}
You feel {&refreshed|renewed|energized}.
-> start

=== check_inventory ===
You have: {inventory}.
{!This is your first time checking.|You've checked before.|Still the same items.}
-> start

=== left_path ===
A goblin jumps out! -> fight_goblin ->
The path continues deeper.
-> continue_deeper

=== fight_goblin ===
The goblin swings at you!
~ temp damage = calculate_damage(10, 2)
~ player_health -= damage
You take {damage} damage.
{player_health <= 0: -> game_over}
->->

=== continue_deeper ===
You venture deeper into the dungeon...
-> END

=== game_over ===
Your health drops to zero. Game over!
-> END 