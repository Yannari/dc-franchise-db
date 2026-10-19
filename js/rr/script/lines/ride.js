// A ride that is a leg's signature (a place's stretch with ride: true; director.js): the general lines, which name
// no animal and no vehicle, for a ride a place hasn't written its own for. A place's own (places/*.js) win.
import { V } from './places/_kit.js';

export default {
  'ride.any': [
    { id: 'rd.1', turns: [
      { beat: '{a} and {b} hang on as the ride lurches forward.' },
      { by: 'a', ...V("Nobody told me this part would be the scary part.", "Nobody said this part was the scary part.", "Nobody mentioned this was the scary part.", "NOBODY told me this would be the SCARY part!",
        "Nobody told me this part would be the scary part.", "Nobody warned me the travelling would be the challenge.") },
      { by: 'b', ...V("Hold on to me. I've got you.", "Hold on. I've got you.", "Hold on to me. I've got you.", "Hold on to ME, I've GOT you!",
        "Hold on to me, okay? I've got you.", "Hold on to me. We go down together.") },
    ] },
    { id: 'rd.2', turns: [
      { beat: 'For a few minutes there is nothing to do but ride.' },
      { by: 'b', ...V("This is the first time all day nobody's yelling at us.", "First time all day nobody's yelling.", "This is the first time today nobody's yelling at us.", "This is the FIRST time all day nobody's YELLING at us!",
        "This is the first time all day that nobody's yelling at us.", "Listen. Nobody is yelling. It's beautiful.") },
      { by: 'a', ...V("Don't say that out loud. Somebody will hear you and start.", "Don't say it. Somebody will start.", "Don't say that. Somebody will hear you and start.", "Don't say that OUT LOUD, somebody will hear you and START!",
        "Don't say that out loud, though. Somebody will hear and start yelling.", "Don't say it. The yelling can hear you.") },
    ] },
  ],
};
