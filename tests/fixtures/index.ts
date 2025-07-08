/**
 * MIT License
 *
 * Copyright (c) 2025 Martin Crawford
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Test fixtures helper module
 * Provides easy access to compiled Ink stories and external functions
 */

import { TestFixture, TestFixtures } from "./fixture-compiler";

/**
 * Gets a fixture by name
 * @param name The name of the fixture
 * @returns The fixture object
 */
export function getFixture(name: string): TestFixture {
  if (!global.testFixtures || !global.testFixtures[name]) {
    throw new Error(
      `Fixture "${name}" not found. Available fixtures: ${Object.keys(
        global.testFixtures || {}
      ).join(", ")}`
    );
  }
  const fixture = global.testFixtures[name];
  if (name === "externalFunctions") {
    throw new Error(
      `Use getExternalFunctions() instead of getFixture("${name}")`
    );
  }
  return fixture as TestFixture;
}

/**
 * Gets the external functions for testing
 * @returns Object containing external functions
 */
export function getExternalFunctions(): { [key: string]: Function } {
  return (global.testFixtures as any)?.externalFunctions || {};
}

/**
 * Gets all available fixtures
 * @returns All fixtures object
 */
export function getAllFixtures(): TestFixtures {
  return (global.testFixtures as TestFixtures) || {};
}

/**
 * Predefined fixture names for easy access
 */
export const FixtureNames = {
  simple: "test-story-simple",
  singleChoice: "test-story-single-choice",
  external: "test-story-external",
  complex: "test-story",
} as const;

/**
 * Helper functions to get specific fixtures
 */
export const Fixtures = {
  simple: () => getFixture(FixtureNames.simple),
  singleChoice: () => getFixture(FixtureNames.singleChoice),
  external: () => getFixture(FixtureNames.external),
  complex: () => getFixture(FixtureNames.complex),
  externalFunctions: () => getExternalFunctions(),
} as const;
