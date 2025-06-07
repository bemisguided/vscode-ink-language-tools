-> start

=== start ===
Welcome to the Ink Story Preview System! #welcome

This is a simple interactive story to demonstrate the features.

* [Continue the adventure] #adventure
    -> adventure
* [Learn about the system] #tutorial
    -> tutorial

=== adventure ===
You step into a magical forest. #forest
Sunlight filters through the ancient trees.

* [Follow the main path] #safe
    -> main_path
* [Explore off the beaten track] #risky
    -> hidden_path

=== tutorial ===
This preview system supports several advanced features: 

- **Real-time preview** of your Ink stories 
- **Inline tag display** for metadata and game integration 
- **Clean, modern interface** that adapts to your VSCode theme 

* [Try the adventure story] 
    -> adventure
* [See advanced features] 
    -> advanced_features

=== main_path ===
The path leads to a peaceful clearing. 
A gentle stream bubbles nearby. 

You feel refreshed and ready for new adventures! 

* [Rest by the stream] 
    -> stream_rest
* [Continue exploring] 
    -> start

=== hidden_path ===
You discover a hidden grove filled with glowing flowers! #discovery
This is exactly the kind of secret you hoped to find.

* [Gather some flowers] #collect
    -> collect_flowers
* [Just admire the beauty] #admire
    -> admire_beauty

=== advanced_features ===
The system also includes: 

- **Syntax highlighting** for better code readability 
- **Error detection** with helpful suggestions 
- **Include support** for organizing large projects 

Try creating your own stories to see these features in action! 

* [Start over] 
    -> start

=== stream_rest ===
You sit by the stream and feel completely at peace. 
The gentle sound of water washes away all your worries. 

**Story Complete** - You found inner peace! 
-> END

=== collect_flowers ===
You carefully gather a few of the magical flowers. 
They continue to glow softly in your hands. 

**Story Complete** - You found something truly special! 
-> END

=== admire_beauty ===
Sometimes the greatest treasures are meant to be left untouched. 
The memory of this magical place will stay with you forever. 

**Story Complete** - You chose wisdom over greed! 
-> END 