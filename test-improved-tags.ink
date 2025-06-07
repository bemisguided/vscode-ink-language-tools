-> start

=== start ===
You wake up in a strange place. # location=bedroom mood=confused time=morning
The sunlight streams through unfamiliar windows. # atmosphere=peaceful lighting=bright weather=sunny

* [Get out of bed] # action=movement difficulty=easy energy=required
    -> get_up
* [Look around the room] # action=observe difficulty=easy focus=required
    -> examine_room
* [Try to remember where you are] # action=think difficulty=medium focus=high
    -> remember

=== get_up ===
You slowly stand up, feeling slightly dizzy. # sensation=dizzy health=concern movement=slow
Your legs feel weak beneath you. # health=weakness stability=poor

* [Sit back down] # action=safety priority=health
    -> sit_down
* [Walk to the window] # action=explore risk=medium
    -> window

=== examine_room ===
The room is well-furnished but unfamiliar. # observation=detailed knowledge=unknown
There's a photo on the nightstand you don't recognize. # item=photo mystery=true

* [Pick up the photo] # action=investigate item=photo curiosity=high
    -> photo
* [Check the closet] # action=search location=closet
    -> closet

=== remember ===
You strain to remember, but your memory is foggy. # mental=effort memory=impaired
Fragments of images flash through your mind. # mental=fragments clarity=low

* [Focus harder] # action=concentrate effort=high risk=headache
    -> focus_memory
* [Give up for now] # action=accept mood=resignation
    -> give_up

=== sit_down ===
You carefully sit back on the bed. # action=careful health=priority
The dizziness fades slightly. # sensation=improvement health=better

-> start

=== window ===
Through the window, you see a city you don't recognize. # view=cityscape knowledge=unknown location=unfamiliar
The architecture looks European. # observation=architecture style=european

* [Try to identify the city] # action=analyze knowledge=geography
    -> identify_city
* [Look for clues in the room] # action=investigate focus=clues
    -> examine_room

=== photo ===
The photo shows you with people you don't remember. # content=people memory=missing relationship=unknown
This is deeply unsettling. # emotion=unsettled concern=identity

* [Study the faces carefully] # action=analyze focus=faces
    -> study_faces
* [Put the photo down] # action=avoid emotion=overwhelmed
    -> examine_room

=== closet ===
The closet contains clothes in your size but not your style. # content=clothes fit=correct style=wrong
Everything feels wrong somehow. # emotion=wrongness intuition=negative

* [Check the pockets] # action=search item=pockets hope=clues
    -> pockets
* [Close the closet] # action=avoid emotion=uncomfortable
    -> examine_room

=== focus_memory ===
You push harder, and suddenly a flash of pain shoots through your head. # sensation=pain intensity=sharp location=head
A memory surfaces: you were in an accident. # memory=accident event=trauma

* [Remember more] # action=pursue risk=pain
    -> accident_memory
* [Stop trying] # action=stop priority=health
    -> give_up

=== give_up ===
You decide to stop pushing your memory for now. # decision=practical emotion=acceptance
Perhaps the answers will come naturally. # hope=patience strategy=waiting

-> start

=== identify_city ===
Looking at the architecture and signs, you think this might be Prague. # location=prague certainty=moderate
But you have no idea how you got here. # mystery=travel knowledge=missing

* [This is getting scary] # emotion=fear realization=danger
    -> scared
* [Try to find more clues] # action=investigate determination=high
    -> examine_room

=== study_faces ===
One face seems familiar - a woman with kind eyes. # person=woman feature=eyes emotion=kindness memory=faint
Could she be someone important to you? # relationship=unknown importance=possible

* [Focus on remembering her] # action=focus target=woman effort=high
    -> remember_woman
* [Look at the others] # action=examine target=others
    -> other_faces

=== pockets ===
In the jacket pocket, you find a hospital bracelet. # item=bracelet location=hospital significance=major
Your name is on it, but the date was just three days ago. # information=name time=recent
-> END

=== accident_memory ===
The memory floods back: a car crash, then darkness. # memory=crash event=accident consequence=darkness
You were hurt badly. # injury=severe condition=critical
-> END

=== scared ===
Fear washes over you as you realize how lost you truly are. # emotion=fear realization=lost intensity=high
Nothing makes sense anymore. # state=confusion understanding=zero
-> END

=== remember_woman ===
Slowly, her name comes to you: Sarah. # name=sarah memory=returning clarity=increasing
She was... she was with you in the car. # location=car event=accident person=sarah
-> END

=== other_faces ===
The other faces remain mysteries. # status=unknown memory=blocked
But Sarah's face grows clearer in your mind. # person=sarah clarity=improving memory=focused
-> END 