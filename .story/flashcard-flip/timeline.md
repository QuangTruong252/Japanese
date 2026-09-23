# Timeline: flashcard-flip

## Intent
- Purpose: Make vocabulary review feel like a physical two-sided flashcard: prompt first, answer only after an intentional reveal, then self-rate recall.
- User trigger: Activate “Lật thẻ xem đáp án” by touch, mouse, Enter, or Space; activate “Quay lại mặt trước” to reverse.
- Framework/library: React state with CSS 3D transforms; no animation dependency.
- Reduced-motion behavior: Switch faces immediately with no rotation when `prefers-reduced-motion: reduce` is enabled.

## Actors
| Actor | Selector/component | Role | Initial state |
| --- | --- | --- | --- |
| Card scene | Vocabulary flashcard scene | Stable perspective and clipping boundary | Front face active |
| Card body | Inner two-face wrapper | Owns the 3D Y-axis rotation | `rotateY(0deg)` |
| Front face | Front face of the active vocabulary item | Japanese prompt, reading, word audio, progress context | Facing the learner |
| Back face | Reverse of the same item | Meaning, verified lesson example, separate word/example audio, recall ratings | Rotated away and hidden from assistive technology |
| Flip control | “Lật thẻ xem đáp án” / “Quay lại mặt trước” | Clear accessible control to reveal or revisit the prompt | Reveal action available |

## Sequence
| ID | Time offset | Actor | Motion | Duration | Easing | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | 0.0s | Flip control | Activate reveal; set the back as the accessible active face | 0ms | — | Keep focus on the control; the learner can inspect the prompt before revealing. |
| T2 | 0.0s | Card body | Rotate Y from 0deg to 180deg | 420ms | `ease-in-out` | One continuous, reversible rotation; preserve scene dimensions and avoid layout shift. |
| T3 | 0.0s | Back face | Present meaning, example, distinct audio controls, and self-rating choices | 0ms | — | Backface hidden prevents mirrored text; rating remains a deliberate learner action. |
| T4 | On reverse action | Card body | Rotate Y from 180deg to 0deg and restore front semantics | 420ms | `ease-in-out` | Retain the current vocabulary item and focus. |
| T5 | Any flip with reduced motion | Card body/faces | Switch directly to the selected face | 0ms | — | Keep the same focus, content order, and accessibility state. |

## Constraints
- Performance: Animate only `transform`; use a stable perspective wrapper and `backface-visibility: hidden`; avoid animating layout, blur, or shadow.
- Accessibility: Expose only the active face to assistive technology and keyboard navigation; use a real, labelled button for flip/reverse; support Enter and Space; keep audio and rating controls independently operable; avoid communicating state through motion alone.
- Responsive behavior: Keep the same single-card flow on mobile and desktop; reserve enough vertical room for the complete active face and its controls; respect device safe areas and avoid horizontal overflow.
- Open questions: Confirm the timeline before DOM/layer planning. The next design pass must decide where the flip control sits relative to the card and how the back face fits on a short mobile viewport.

## Reference patterns
- Quizlet Learn exposes study options such as terms/definitions, starred terms, shuffle, audio, and grading preferences: https://help.quizlet.com/hc/en-us/articles/360030986971-Studying-with-Learn
- Anki defines distinct front and back templates for each card type: https://docs.ankiweb.net/templates/intro.html
- This screen will add the requested physical 3D flip; the references inform content separation and learner control, not an assumption that both products use the same animation.
