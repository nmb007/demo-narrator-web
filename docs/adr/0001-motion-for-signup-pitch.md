# Motion for the signup convert animation

The signup pitch needs one looping convert: a product-demo frame, a scan, and particle-ribbon sound waves (noisy take becoming smooth narration).

CSS SVG keyframes could not match the dense ribbon look. A Lottie file either grew too large to paint or collapsed into dotted strokes.

Motion (`motion/react`) drives a canvas with `animate` on a motion value and `useAnimationFrame` for the particle field, so the dots stay off the React tree. `MotionConfig reducedMotion="user"` follows the OS setting.
