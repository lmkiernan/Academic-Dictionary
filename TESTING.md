# TESTING.md

## Testing Overview

This extension was tested manually through a series of interface walkthroughs and prompt-based scenario tests. Given the lightweight nature of the appautomated test suites (e.g., Jest) were not employed.

---

## 1. Interface Testing

### Testing Approach: Manual

The following core interface elements were manually tested using real user interactions within the Chrome extension popup:

#### ✅ API Key Input Flow
- **Steps Tested:**
  - Selecting OpenAI or Gemini
  - Entering a valid/invalid API key
  - Submitting the key
- **Expected Outcome:** 
  - Valid keys initialize the main UI and show a success notification.
  - Invalid keys produce an error message and do not continue.

#### ✅ Text Selection & Definition Retrieval
- **Steps Tested:**
  - Selecting text on a webpage, right-clicking, and choosing “Define”
  - Opening the extension to view the selection and definition
- **Expected Outcome:**
  - If selection is fresh, the definition loads automatically.
  - If not, the user sees a prompt to "Define".

#### ✅ Simpler Explanation Button
- **Steps Tested:**
  - Clicking “Simpler” to get a layman-friendly definition
- **Expected Outcome:**
  - New prompt sent to the selected provider with simplified prompt structure.
  - The UI reflects the loading state and then displays the new explanation.

#### ✅ Save & Delete Notes
- **Steps Tested:**
  - Clicking “Save” to save a definition
  - Viewing saved notes
- **Expected Outcome:**
  - Notes are stored in Chrome local storage.

---

## 2. Prompt Testing

### Model Used:
- `gpt-4o-mini` via OpenAI API
- `gemini-2.0-flash` via Gemini API

---

### Test Case 1: Academic Prompt with OpenAI

- **Input Text:** `Poststructuralism`
- **Prompt Sent:** Define the term "poststructuralism" in an academic context. Include key aspects, scholarly significance, and relevant academic fields where this term is used.
- **Expected Output:** A structured definition covering its origin, major contributors (e.g., Derrida, Foucault), key concepts like deconstruction, and its role in literary theory, sociology, etc.
- **Actual Output:**    
    Poststructuralism is an intellectual movement and critical approach that emerged in the mid-20th century as a response to and critique of structuralism, particularly its assumptions about language, meaning, and objectivity. It is most commonly associated with French theorists such as Jacques Derrida, Michel Foucault, Roland Barthes, and Julia Kristeva, among others.

    Key Aspects:
  - Rejection of Fixed Meaning: Poststructuralism challenges the idea that language has stable, fixed meanings. Instead, it posits that meaning is always deferred and context-dependent, a concept Derrida described as différance.
  - Deconstruction: A central method in poststructuralist thought, deconstruction involves unpacking and exposing contradictions within texts to reveal the instability of meaning and binary oppositions (e.g., good/evil, male/female).
  - Power and Knowledge: Foucault’s work links knowledge production to systems of power, showing how discourses shape what is accepted as “truth” in a given society.
  - Subjectivity: The notion of a coherent, autonomous self is questioned. Instead, identity is seen as fragmented and constructed through language, culture, and discourse.

    Scholarly Significance:

    Poststructuralism has been instrumental in rethinking foundational concepts in Western thought, including authorship, truth, morality, and objectivity. It opened up new ways of interpreting texts, cultural practices, and social institutions, encouraging critical reflexivity and skepticism toward dominant narratives.

    Relevant Academic Fields:
  - Literary Theory and Criticism: Influences close reading, intertextuality, and narrative analysis.
  - Philosophy: Challenges epistemology, metaphysics, and ethics through critiques of language and representation.
  - Cultural and Media Studies: Examines how culture constructs meaning and identity through signs and symbols.
  - Sociology and Anthropology: Reassesses social structures and cultural norms in light of discourse analysis.
  - Gender and Queer Theory: Undermines essentialist views of gender and sexuality, advocating for fluid and performative understandings.

    In sum, poststructuralism has had a transformative impact across the humanities and social sciences by emphasizing the contingency, complexity, and constructedness of meaning, identity, and knowledge.
- **Evaluation:** Met expectations. Response included intellectual origins, influence on various disciplines, and referenced major thinkers. High accuracy and academic tone. Included citation-like phrasing and historical context.

---

### Test Case 2: Simplified Prompt with Gemini

- **Input Text:** `Quantum Entanglement`
- **Prompt Sent:** Explain the concept of "quantum entanglement" in simple terms that a general audience would understand. Include a brief example to illustrate the concept.
- **Expected Output:** Layman explanation (e.g., “two particles that stay connected no matter the distance”), example scenario, and removal of jargon.
- **Actual Output:** Quantum entanglement is a bizarre phenomenon in quantum mechanics where two or more particles become linked together in such a way that they share the same fate, no matter how far apart they are. 1  It's as if these particles have an invisible connection that transcends space. 
    
  Imagine you have a pair of gloves in a box, and you don't know which glove is left and which is right. You send one glove to a friend in another city without looking inside the box. When you finally open your box and find a left-handed glove, you instantly know that your friend must have the right-handed glove, even though you haven't communicated with them.

  Quantum entanglement is similar, but much stranger. Instead of gloves, think of subatomic particles like electrons that have a property called "spin," which can be either "up" or "down." When two particles become entangled, their spins become correlated. Until you measure the spin of one of the particles, it's in a superposition, meaning it's both "up" and "down" at the same time. However, the moment you measure one particle and find its spin to be "up," the spin of the other entangled particle instantly becomes "down," regardless of the distance separating them.

  This "spooky action at a distance," as Einstein called it, puzzled scientists for a long time because it seemed to violate the laws of physics, which state that nothing can travel faster than the speed of light. However, numerous experiments have confirmed that entanglement is a real phenomenon.

  It's important to note that while entangled particles are linked, this connection cannot be used to send information faster than light. The outcome of measuring a particle's property is random, so you can't control the result at one end to send a specific message to the other end.

  Despite its mysterious nature, quantum entanglement is a fundamental concept in quantum mechanics and has potential applications in emerging technologies like quantum computing and quantum communication.
- **Evaluation:** Met expectations. Example included glove metaphor. No heavy math, clear analogy. Good simplification. One possible improvement: include limitations of the metaphor explicitly.

---

## Additional Notes

- Rate limiting and error scenarios were tested by:
  - Using expired API keys (resulted in clear error messaging).
  - Triggering the same request multiple times to test UI fallback (loading spinners, retry buttons).
  - Prompt flexibility was confirmed by testing inputs like `Structural Functionalism`, `Narrative Theory`, and `Thermodynamics`.

---

## Summary

All core features have been manually verified. Future improvements may include:
- Modularizing fetch and formatting functions for unit testing.
- Adding prompt validation logic before API calls.