// MOCKS examples/space-station-mocks.js

// External function declarations
EXTERNAL init_game_state()
EXTERNAL get_player_name()
EXTERNAL get_player_health()
EXTERNAL get_health_status()
EXTERNAL heal_player(amount)
EXTERNAL get_station_power()
EXTERNAL modify_station_power(amount)
EXTERNAL get_life_support_time()
EXTERNAL get_skill_level(skill)
EXTERNAL get_system_status(system)
EXTERNAL get_system_efficiency(system)
EXTERNAL get_reactor_temp()
EXTERNAL run_diagnostic(system)
EXTERNAL get_technical_problem(system)
EXTERNAL attempt_repair(system)
EXTERNAL get_repair_result(system)
EXTERNAL get_repair_success(system)
EXTERNAL stabilize_reactor()
EXTERNAL fix_primary_issue(system)
EXTERNAL apply_temp_fix(system)
EXTERNAL boost_shields(amount)
EXTERNAL set_story_flag(flag, value)
EXTERNAL get_story_flag(flag)
EXTERNAL record_achievement(achievement)
EXTERNAL save_game(slot)
EXTERNAL get_alien_message()
EXTERNAL get_reputation(faction)
EXTERNAL analyze_quantum_data()
EXTERNAL get_quantum_insight()
EXTERNAL calculate_final_score()
EXTERNAL get_current_time()
EXTERNAL get_overall_status()
EXTERNAL help_wounded()

-> initialize

=== initialize ===
~ init_game_state()
You are {get_player_name()}, Chief Engineer aboard the space station Meridian. #engineer

The station shudders violently as another impact hits the hull. #crisis
Emergency lights bathe the corridor in red.

Your current health: {get_player_health()}/100
Power level: {get_station_power()}%

* [Rush to the bridge] #urgent
    -> bridge
* [Check the engineering bay]
    -> engineering
* [Head to the medical bay]
    -> medical

=== bridge ===
Captain Torres looks up grimly as you enter. #torres
"Engineer! The attacks are getting worse. Can you boost our shields?"

Your engineering skill: {get_skill_level("engineering")}

* {get_skill_level("engineering") >= 75} [Reroute power from life support] #risky
    ~ modify_station_power(-15)
    ~ boost_shields(25)
    -> power_reroute
* [Run a quick diagnostic]
    ~ run_diagnostic("shields")
    -> diagnostic
* [Suggest we retreat]
    -> retreat_suggestion

=== engineering ===
The engineering bay is chaos. Sparks fly from damaged consoles. #chaos

You check the main power coupling.
Status: {get_system_status("power_coupling")}

Your repair skill: {get_skill_level("repair")}

* {get_skill_level("repair") >= 50} [Attempt emergency repairs] #repair
    ~ attempt_repair("power_coupling")
    -> repair_attempt
* [Stabilize the reactor]
    ~ stabilize_reactor()
    -> reactor_work
* [Check the damage report]
    -> damage_report

=== medical ===
Dr. Chen is treating wounded crew members. #chen
"Your health is concerning," she says, scanning you.

Current condition: {get_health_status()}

* [Get treated] #healing
    ~ heal_player(30)
    Your health improved to {get_player_health()}/100!
    -> post_treatment
* [Help with the wounded]
    ~ help_wounded()
    -> help_others
* [Ask about the station's condition]
    -> station_status

=== power_reroute ===
~ set_story_flag("shields_boosted", true)
You successfully reroute power! The shields strengthen noticeably. #success

But the lights dim as life support power drops. #warning
Time remaining on reduced life support: {get_life_support_time()} minutes

The attacks stop suddenly. An alien vessel decloaks off the port bow. #aliens #firstcontact

* [Hail the alien ship]
    -> alien_contact
* [Prepare for boarding] #combat
    -> prepare_defenses
* [Try to escape]
    -> escape_attempt

=== diagnostic ===
Your diagnostic reveals the shield generators are operating at {get_system_efficiency("shields")}% efficiency. #technical

You discover the issue: {get_technical_problem("shields")}

* [Fix the primary issue]
    ~ fix_primary_issue("shields")
    -> shield_repair
* [Apply a temporary patch] #temporary
    ~ apply_temp_fix("shields")
    -> temp_solution
* [Need more time to analyze]
    -> deeper_analysis

=== retreat_suggestion ===
Captain Torres shakes her head. "We can't abandon the research data. Too important." 

"The data on the quantum drive could revolutionize space travel." 

Your science skill: {get_skill_level("science")} 

* {get_skill_level("science") >= 60} [Analyze the quantum data] 
    ~ analyze_quantum_data()
    -> quantum_discovery
* [Insist on evacuation] 
    -> evacuation_conflict
* [Propose a compromise] 
    -> compromise_plan

=== repair_attempt ===
~ save_game("repair_checkpoint")
You work quickly on the damaged coupling. 

Result: {get_repair_result("power_coupling")} 

{get_repair_success("power_coupling"): 
- true: The repair holds! Power is restored to 85%. 
- false: The repair fails. You need better tools or help. 
}

* {get_repair_success("power_coupling")} [Return to bridge with good news] 
    -> success_report
* {not get_repair_success("power_coupling")} [Try a different approach] 
    -> alternative_repair
* [Check on other systems] 
    -> system_check

=== reactor_work ===
The reactor stabilizes under your expert touch. 

Power output: {get_station_power()}% 
Core temperature: {get_reactor_temp()}°C 

~ record_achievement("reactor_stabilized")

* [Monitor the readings] 
    -> monitor_reactor
* [Return to help elsewhere] 
    -> choose_next_action
* [Optimize the reactor further] 
    -> reactor_optimization

=== alien_contact ===
~ set_story_flag("contacted_aliens", true)
The alien response comes through in broken Universal Standard: #communication

"{get_alien_message()}"

Your diplomacy skill: {get_skill_level("diplomacy")}

* {get_skill_level("diplomacy") >= 70} [Negotiate a peaceful solution] #peaceful
    -> successful_negotiation
* [Ask about their intentions]
    -> alien_intentions
* [Warn them to leave] #aggressive
    -> hostile_response

=== successful_negotiation ===
~ record_achievement("peaceful_diplomat")
~ set_story_flag("peace_achieved", true)

Your diplomatic skills save the day! The aliens were protecting an ancient artifact. #victory

They share coordinates to a safe passage home.
Your reputation with alien civilizations: {get_reputation("aliens")}

Final score: {calculate_final_score()}

The crisis ends with new allies and incredible discoveries. #victory

=== quantum_discovery ===
~ record_achievement("quantum_breakthrough")
Your analysis reveals something extraordinary! #breakthrough

{get_quantum_insight()}

This discovery will change everything. #victory

=== choose_next_action ===
Where do you want to go next?

Current time: {get_current_time()}
Station status: {get_overall_status()} #status

* [Bridge]
    -> bridge
* [Medical bay]
    -> medical  
* [Continue in engineering]
    -> engineering

=== post_treatment ===
Dr. Chen nods approvingly. "Much better. Now you can help save the station." #chen

~ record_achievement("medical_treatment")
Your improved health will help in the challenges ahead.

* [Return to the bridge]
    -> bridge
* [Help in engineering]
    -> engineering
* [Stay and help with more wounded] #heroic
    -> help_others

=== help_others ===
You spend precious time helping Dr. Chen treat the wounded crew. 

~ record_achievement("crew_helper")
"Thank you," Dr. Chen says. "Your compassion makes you a true leader." 

The crew's morale improves, and they work more efficiently. 

* [Now head to the bridge] 
    -> bridge
* [Check engineering systems] 
    -> engineering

=== station_status ===
Dr. Chen pulls up the station's status report on her medical terminal. 

"Hull integrity at 60%. Multiple system failures. We have maybe an hour before critical failure." 

Your medical skill: {get_skill_level("medical")} 

* {get_skill_level("medical") >= 40} [Suggest triage protocols] 
    -> medical_advice
* [Focus on engineering solutions] 
    -> engineering
* [Rally the crew] 
    -> crew_rally

=== prepare_defenses ===
You coordinate with security to prepare for potential boarding. 

The crew sets up barricades and checks weapon systems. 

* [Set up in engineering to protect critical systems] 
    -> defensive_engineering
* [Join the bridge crew for command coordination] 
    -> bridge_defense
* [Help evacuate non-essential personnel] 
    -> evacuation_prep

=== escape_attempt ===
"All hands, prepare for emergency jump!" you call out. 

The damaged engines strain under the demand. 

* [Boost engine power with emergency reserves] 
    -> emergency_jump
* [Calculate a shorter, safer jump] 
    -> safe_jump
* [Abort - too dangerous] 
    -> abort_escape

=== shield_repair ===
~ record_achievement("shield_engineer")
Your expert repair work brings the shields back to full efficiency! 

"Shields at 100%!" comes the report from the bridge. 

* [Return to bridge as a hero] 
    -> hero_return
* [Check other systems while you're here] 
    -> system_maintenance
* [Prepare for the next crisis] 
    -> crisis_preparation

=== temp_solution ===
Your quick patch holds the shields at 70% efficiency. 

"It's not perfect, but it'll have to do," you mutter. 

~ set_story_flag("temp_fix_applied", true)

* [Find a more permanent solution] 
    -> permanent_repair
* [Focus on other critical systems] 
    -> system_triage
* [Report to the bridge] 
    -> bridge

=== deeper_analysis ===
You spend valuable time running comprehensive diagnostics. 

The detailed analysis reveals a cascading failure in the shield matrix. 

* [Attempt the complex repair] 
    -> complex_repair
* [Call for additional engineering support] 
    -> call_support
* [Recommend immediate evacuation] 
    -> evacuation_protocol

=== evacuation_conflict ===
"I understand your concern," Captain Torres says firmly, "but we cannot abandon our mission." 

The tension on the bridge is palpable. 

* [Present a compelling safety argument] 
    -> safety_argument
* [Offer to retrieve the data yourself] 
    -> data_retrieval_offer
* [Accept the captain's decision] 
    -> accept_orders

=== compromise_plan ===
"What if we copy the essential data to portable storage?" you suggest. 

Captain Torres considers this. "That... might work. How long would it take?" 

* [Estimate 15 minutes with help] 
    -> quick_copy
* [Say it needs 30 minutes to be safe] 
    -> safe_copy
* [Admit it could take an hour] 
    -> long_copy

=== success_report ===
~ record_achievement("engineering_hero")
You stride onto the bridge with confidence. "Power coupling repaired, Captain!" 

Captain Torres smiles with relief. "Excellent work, Engineer!" 

* [Suggest your next priority] 
    -> next_priority
* [Ask for new orders] 
    -> await_orders
* [Check on crew morale] 
    -> crew_check

=== alternative_repair ===
You try a different approach using backup systems and creative workarounds. 

Your resourcefulness pays off! The backup solution works even better. 

~ record_achievement("creative_engineer")

* [Document this solution for future use] 
    -> document_solution
* [Apply this technique to other systems] 
    -> apply_technique
* [Return to the bridge with the good news] 
    -> success_report

=== system_check ===
You perform a comprehensive check of all major systems. 

Critical systems status:
- Life Support: {get_system_status("life_support")} 
- Engines: {get_system_status("engines")} 
- Communications: {get_system_status("communications")} 

* [Prioritize the most critical failure] 
    -> critical_repair
* [Try to fix multiple systems quickly] 
    -> multi_repair
* [Report all findings to the bridge] 
    -> full_report

=== monitor_reactor ===
You maintain careful watch over the reactor's vital signs. 

The readings stabilize beautifully under your expert supervision. 

~ record_achievement("reactor_specialist")

* [Optimize efficiency while monitoring] 
    -> efficiency_boost
* [Train a crew member to help monitor] 
    -> train_assistant
* [Continue monitoring until crisis passes] 
    -> dedicated_monitoring

=== reactor_optimization ===
You carefully adjust the reactor's parameters for maximum efficiency. 

Your modifications boost power output by 15% without compromising safety! 

~ modify_station_power(15)
~ record_achievement("master_engineer")

* [Share your improvements with the crew] 
    -> share_knowledge
* [Document the optimization] 
    -> document_work
* [Apply similar optimizations elsewhere] 
    -> optimize_other_systems

=== alien_intentions ===
The alien's response is clearer this time: 

"We... protect... ancient... your ship... disturb..." 

You realize they're guarding something, not attacking! 

* [Ask what they're protecting] 
    -> learn_about_artifact
* [Offer to leave their space] 
    -> respectful_withdrawal
* [Propose cooperation] 
    -> cooperation_offer

=== hostile_response ===
Your threatening tone escalates the situation dramatically. 

The alien ship powers up weapons! "Human... aggressive... defend..." 

* [Immediately apologize and try to de-escalate] 
    -> apologize_quickly
* [Prepare for combat] 
    -> combat_preparation
* [Attempt emergency evacuation] 
    -> emergency_evacuation

=== damage_report ===
You access the central damage control system. 

The report is sobering:
- Hull breaches: 3 minor, 1 major 
- System failures: 7 critical, 12 minor 
- Personnel injuries: 15 

* [Focus on the hull breach] 
    -> hull_repair
* [Address critical system failures] 
    -> critical_systems
* [Help coordinate medical response] 
    -> medical_coordination

=== medical_advice ===
Your medical knowledge helps optimize the treatment protocols. 

~ record_achievement("medical_advisor")
The crew's survival rate improves significantly. 
-> choose_next_action

=== crew_rally ===
Your inspiring words boost morale across the station. 

~ record_achievement("inspirational_leader")
"We can do this together!" you declare. 
-> choose_next_action

=== defensive_engineering ===
You fortify the engineering section, protecting the critical systems. 
The crew works efficiently under your protection. 
-> engineering

=== bridge_defense ===
You coordinate the bridge's defensive preparations. 
Captain Torres nods approvingly. "Good thinking, Engineer." 
-> bridge

=== evacuation_prep ===
You help organize the evacuation of non-essential personnel. 
Many lives are saved by your quick thinking. 
~ record_achievement("life_saver")
-> choose_next_action

=== emergency_jump ===
The emergency jump succeeds, but damages the engines further. 
You've escaped immediate danger but face new challenges. 
-> choose_next_action

=== safe_jump ===
Your careful calculations result in a perfect jump to safety. 
~ record_achievement("navigation_expert")
The crew cheers as you reach safe space. 
-> END

=== abort_escape ===
You decide the risk is too great and abort the escape attempt. 
"We'll find another way," you announce. 
-> choose_next_action

=== hero_return ===
You return to the bridge to thunderous applause from the crew. 
~ record_achievement("station_hero")
Captain Torres shakes your hand. "You saved us all." 
-> END

=== system_maintenance ===
You perform additional maintenance on critical systems. 
Everything runs more smoothly under your expert care. 
-> choose_next_action

=== crisis_preparation ===
You prepare the station for whatever crisis comes next. 
Your preparations prove invaluable when the next emergency hits. 
~ record_achievement("crisis_manager")
-> choose_next_action

=== permanent_repair ===
You implement a permanent solution to the shield problem. 
The shields are now stronger than ever before. 
~ record_achievement("master_engineer")
-> choose_next_action

=== system_triage ===
You quickly assess and prioritize all critical system repairs. 
Your efficient approach saves precious time and resources. 
-> choose_next_action

=== complex_repair ===
The complex repair challenges every skill you have. 
{get_skill_level("repair") >= 80: You succeed brilliantly! -> success_report | The repair fails, but you learn valuable lessons. -> alternative_repair}

=== call_support ===
You call for additional engineering support to help. 
Working together, the team solves the problem efficiently. 
~ record_achievement("team_leader")
-> choose_next_action

=== evacuation_protocol ===
You initiate emergency evacuation protocols. 
Lives are saved, but the station may be lost. 
-> END

=== safety_argument ===
Your compelling safety argument changes Captain Torres' mind. 
"You're right. Prepare for immediate evacuation." 
-> evacuation_protocol

=== data_retrieval_offer ===
"I'll get the data myself," you volunteer heroically. 
Your brave offer impresses everyone. 
-> quantum_discovery

=== accept_orders ===
You accept the captain's decision with professional respect. 
Sometimes following orders is the right choice. 
-> choose_next_action

=== quick_copy ===
The quick data copy works perfectly! 
You've saved both the crew and the mission. 
-> END

=== safe_copy ===
The careful data copy ensures nothing is lost. 
A perfect balance of safety and mission success. 
-> END

=== long_copy ===
The thorough copy takes time, but captures everything. 
The delay creates tension, but the data is invaluable. 
-> quantum_discovery

=== next_priority ===
"What should we focus on next?" you ask the captain. 
Captain Torres outlines the next phase of crisis management. 
-> choose_next_action

=== await_orders ===
You wait professionally for the captain's orders. 
"Stand by for further instructions," comes the reply. 
-> choose_next_action

=== crew_check ===
You check on crew morale throughout the station. 
The crew's spirits are higher thanks to your leadership. 
~ record_achievement("crew_morale_booster")
-> choose_next_action

=== document_solution ===
You carefully document your innovative repair technique. 
Future engineers will benefit from your discovery. 
-> choose_next_action

=== apply_technique ===
You apply your innovative technique to other systems. 
Multiple systems benefit from your creative approach. 
-> choose_next_action

=== critical_repair ===
You focus on the most critical system failure. 
Your expertise saves the day once again. 
-> choose_next_action

=== multi_repair ===
You attempt to fix multiple systems simultaneously. 
{get_skill_level("repair") >= 70: You succeed at everything! -> success_report | You manage partial repairs. -> system_check}

=== full_report ===
You provide a comprehensive status report to the bridge. 
The detailed information helps command make better decisions. 
-> bridge

=== efficiency_boost ===
Your optimizations boost reactor efficiency even further. 
The station now runs at peak performance. 
~ record_achievement("efficiency_expert")
-> choose_next_action

=== train_assistant ===
You train a crew member to help monitor the reactor. 
"Thank you for teaching me," they say gratefully. 
-> choose_next_action

=== dedicated_monitoring ===
You maintain vigilant watch until the crisis completely passes. 
Your unwavering attention prevents any further problems. 
~ record_achievement("vigilant_guardian")
-> END

=== share_knowledge ===
You share your reactor improvements with the entire crew. 
Everyone learns from your expertise. 
-> choose_next_action

=== document_work ===
You document all your reactor optimizations. 
Future engineers will build on your work. 
-> choose_next_action

=== optimize_other_systems ===
You apply your optimization techniques to other ship systems. 
The entire station benefits from your expertise. 
-> choose_next_action

=== learn_about_artifact ===
The aliens explain they guard an ancient knowledge repository. 
They offer to share some of their wisdom. 
-> quantum_discovery

=== respectful_withdrawal ===
You respectfully offer to leave their protected space. 
The aliens appreciate your respect and offer safe passage. 
-> END

=== cooperation_offer ===
You propose working together for mutual benefit. 
The aliens are intrigued by your peaceful intentions. 
-> successful_negotiation

=== apologize_quickly ===
Your immediate apology diffuses the hostile situation. 
"Human... sorry... we... understand..." they respond. 
-> alien_intentions

=== combat_preparation ===
You prepare the station's defenses for combat. 
The crew rallies to your leadership in this crisis. 
-> choose_next_action

=== emergency_evacuation ===
You coordinate an emergency evacuation under fire. 
Most of the crew escapes safely thanks to your leadership. 
-> END

=== hull_repair ===
You coordinate emergency hull breach repairs. 
The patches hold, preventing catastrophic decompression. 
-> choose_next_action

=== critical_systems ===
You focus on restoring the most critical failed systems. 
Your systematic approach restores vital functionality. 
-> choose_next_action

=== medical_coordination ===
You help coordinate the medical response to casualties. 
Your organizational skills help save lives. 
~ record_achievement("medical_coordinator")
-> choose_next_action
