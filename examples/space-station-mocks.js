// Space Station Crisis - External Function Mocks
// This file provides mock implementations for external functions used in the story

// Game state management
let gameState = {
  playerName: "Alex Chen",
  playerHealth: 75,
  stationPower: 65,
  skills: {
    engineering: 80,
    repair: 60,
    science: 70,
    diplomacy: 65,
    medical: 45,
  },
  systems: {
    shields: { efficiency: 45, status: "damaged" },
    power_coupling: { status: "critical", repaired: false },
    reactor: { temperature: 2400, stable: false },
  },
  flags: {},
  achievements: [],
  reputation: {
    aliens: 0,
  },
  lifeSupportTime: 45,
};

// Initialize game state
function init_game_state() {
  console.log("Game state initialized");
  return true;
}

// Player information
function get_player_name() {
  return gameState.playerName;
}

function get_player_health() {
  return gameState.playerHealth;
}

function get_health_status() {
  if (gameState.playerHealth > 80) return "Excellent";
  if (gameState.playerHealth > 60) return "Good";
  if (gameState.playerHealth > 40) return "Concerning";
  if (gameState.playerHealth > 20) return "Critical";
  return "Near Death";
}

function heal_player(amount) {
  gameState.playerHealth = Math.min(100, gameState.playerHealth + amount);
  console.log(
    `Player healed by ${amount}. New health: ${gameState.playerHealth}`
  );
  return gameState.playerHealth;
}

// Station systems
function get_station_power() {
  return gameState.stationPower;
}

function modify_station_power(amount) {
  gameState.stationPower = Math.max(
    0,
    Math.min(100, gameState.stationPower + amount)
  );
  console.log(
    `Station power modified by ${amount}. New power: ${gameState.stationPower}%`
  );
  return gameState.stationPower;
}

function get_life_support_time() {
  return gameState.lifeSupportTime;
}

// Skills system
function get_skill_level(skill) {
  return gameState.skills[skill] || 0;
}

// Systems status
function get_system_status(system) {
  return gameState.systems[system]?.status || "unknown";
}

function get_system_efficiency(system) {
  return gameState.systems[system]?.efficiency || 0;
}

function get_reactor_temp() {
  return gameState.systems.reactor.temperature;
}

// Diagnostic functions
function run_diagnostic(system) {
  console.log(`Running diagnostic on ${system}`);
  if (system === "shields") {
    gameState.systems.shields.efficiency = Math.max(
      0,
      gameState.systems.shields.efficiency + 10
    );
  }
  return `Diagnostic complete on ${system}`;
}

function get_technical_problem(system) {
  const problems = {
    shields: [
      "Primary emitter array misaligned",
      "Power fluctuations in generator matrix",
      "Quantum field instability detected",
      "Backup systems offline",
    ],
  };
  const systemProblems = problems[system] || ["Unknown issue"];
  return systemProblems[Math.floor(Math.random() * systemProblems.length)];
}

// Repair functions
function attempt_repair(system) {
  const success = Math.random() > 0.4; // 60% success rate
  console.log(`Repair attempt on ${system}: ${success ? "SUCCESS" : "FAILED"}`);

  if (success && gameState.systems[system]) {
    gameState.systems[system].repaired = true;
    gameState.systems[system].status = "operational";
  }
  return success;
}

function get_repair_result(system) {
  return gameState.systems[system]?.repaired ? "Success" : "Failed";
}

function get_repair_success(system) {
  return gameState.systems[system]?.repaired || false;
}

function stabilize_reactor() {
  gameState.systems.reactor.stable = true;
  gameState.systems.reactor.temperature = Math.max(
    2000,
    gameState.systems.reactor.temperature - 200
  );
  gameState.stationPower = Math.min(100, gameState.stationPower + 15);
  console.log("Reactor stabilized");
  return true;
}

function fix_primary_issue(system) {
  if (gameState.systems[system]) {
    gameState.systems[system].efficiency = Math.min(
      100,
      gameState.systems[system].efficiency + 30
    );
    gameState.systems[system].status = "operational";
  }
  console.log(`Primary issue fixed for ${system}`);
  return true;
}

function apply_temp_fix(system) {
  if (gameState.systems[system]) {
    gameState.systems[system].efficiency = Math.min(
      100,
      gameState.systems[system].efficiency + 15
    );
  }
  console.log(`Temporary fix applied to ${system}`);
  return true;
}

// Shield functions
function boost_shields(amount) {
  if (gameState.systems.shields) {
    gameState.systems.shields.efficiency = Math.min(
      100,
      gameState.systems.shields.efficiency + amount
    );
  }
  console.log(`Shields boosted by ${amount}%`);
  return gameState.systems.shields.efficiency;
}

// Story flags and achievements
function set_story_flag(flag, value) {
  gameState.flags[flag] = value;
  console.log(`Story flag set: ${flag} = ${value}`);
  return value;
}

function get_story_flag(flag) {
  return gameState.flags[flag] || false;
}

function record_achievement(achievement) {
  if (!gameState.achievements.includes(achievement)) {
    gameState.achievements.push(achievement);
    console.log(`Achievement unlocked: ${achievement}`);
  }
  return true;
}

// Save/Load system
function save_game(slot) {
  console.log(`Game saved to slot: ${slot}`);
  // In a real implementation, this would save to persistent storage
  return true;
}

// Alien interactions
function get_alien_message() {
  const messages = [
    "We... protect... sacred artifact. You... not understand.",
    "Ancient ones... left warning. Danger approaches... from void.",
    "Your kind... young. We... watched long time.",
    "Artifact... contains knowledge. Very dangerous... in wrong hands.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function get_reputation(faction) {
  return gameState.reputation[faction] || 0;
}

// Advanced functions
function analyze_quantum_data() {
  console.log("Analyzing quantum data...");
  return "Quantum analysis complete";
}

function get_quantum_insight() {
  const insights = [
    "The quantum drive creates micro-wormholes through folded space-time!",
    "These readings suggest faster-than-light travel without temporal paradoxes.",
    "The artifact contains star charts to distant galaxies beyond our reach.",
    "This technology could revolutionize interstellar travel within decades.",
  ];
  return insights[Math.floor(Math.random() * insights.length)];
}

function calculate_final_score() {
  let score = 0;
  score += gameState.playerHealth; // Health bonus
  score += gameState.stationPower; // Station efficiency bonus
  score += gameState.achievements.length * 50; // Achievement bonus
  score += Object.values(gameState.skills).reduce((a, b) => a + b, 0); // Skill bonus

  // Special bonuses
  if (gameState.flags.peace_achieved) score += 200;
  if (gameState.flags.shields_boosted) score += 100;
  if (gameState.systems.reactor.stable) score += 150;

  return score;
}

// Utility functions
function get_current_time() {
  const gameTime = new Date();
  gameTime.setFullYear(2387);
  return gameTime.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function get_overall_status() {
  const powerStatus = gameState.stationPower > 50 ? "Stable" : "Critical";
  const healthStatus = gameState.playerHealth > 50 ? "Good" : "Poor";
  return `Power: ${powerStatus}, Health: ${healthStatus}`;
}

// Helper functions for wounded crew
function help_wounded() {
  gameState.reputation.crew = (gameState.reputation.crew || 0) + 10;
  console.log("Helped wounded crew members");
  return true;
}
