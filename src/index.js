// Effect control view cmp
Vue.component('effect-control-view', {
  template: '#effect-control-view-template',
  props: ['effectName', 'level'],
  data: () => ({
    rotateDegree: ['-148deg', '-117deg', '-88deg', '-60deg', '-32deg', '0', '32deg', '60deg', '88deg', '117deg', '148deg'],
  }),
});

// Effect control cmp
Vue.component('effect-control', {
  template: '#effect-control-template',
  props: ['effectName', 'keyUp', 'keyDown', 'level'],
  data: () => ({
    filterChangeInterval: null,
    filterChangeIntervalTime: 500,
    isUp: false,
    isDown: false
  }),
  methods: {
    changeUp() {
      this.$emit('action', {effect: this.effectName, type: 'up'});
    },
    changeDown() {
      this.$emit('action', {effect: this.effectName, type: 'down'});
    }
  },
  created() {
    window.addEventListener('keydown', event => {
      if(event.key === this.keyDown && !this.filterChangeInterval) {
        this.isDown = true;
        this.changeDown();
        this.filterChangeInterval = setInterval(this.changeDown, this.filterChangeIntervalTime);
      } else if(event.key === this.keyUp && !this.filterChangeInterval) {
        this.isUp = true;
        this.changeUp();
        this.filterChangeInterval = setInterval(this.changeUp, this.filterChangeIntervalTime);
      }
    });
    window.addEventListener('keyup', event => {
      if(event.key === this.keyDown || event.key === this.keyUp) {
        clearInterval(this.filterChangeInterval);
        this.isUp = false;
        this.isDown = false;
        this.filterChangeInterval = null;
      }
    });
  }
});

// Pad button cmp
Vue.component('pad-btn', {
  template: '#pad-btn-template',
  props: ['keyName'],
  data: () => ({
    isPlay:false
  }),
  methods: {
    playSound() {
      this.isPlay = true;
      this.$emit('action', { key: this.keyName, play: true });
    },
    stopSound() {
      this.isPlay = false;
      this.$emit('action', { key: this.keyName, play: false });
    }
  },
  created() {
    window.addEventListener('keydown', event => {
      if(event.key === this.keyName) {
        this.playSound();
      }
    });
    window.addEventListener('keyup', event => {
      if(event.key === this.keyName) {
        this.stopSound();
      }
    });
  },
});

new Vue({
  el: '#midi-frame',
  data: () => ({
    pads: [
        ['/audio/track_1.wav', '/audio/track_2.wav', '/audio/track_3.wav', '/audio/track_4.wav']
    ],

    group: null,

    reverbFilter: new Pizzicato.Effects.Reverb({
      time: 0.0001,
      decay: 0.01,
      reverse: false,
      mix: 0.5
    }),
    delayFilter: new Pizzicato.Effects.Delay({
      feedback: 0.6,
      time: 0,
      mix: 0.5
    }),
    lowPassFilter: new Pizzicato.Effects.LowPassFilter({
      frequency: 10,
      peak: 10
    }),

    reverbLevel: 0,
    delayLevel: 0,
    lowPassLevel: 0,

    au_1: null,
    au_2: null,
    au_3: null,
    au_4: null,

    isPause: true,
  }),
  methods: {
    // Create Pizzicato sound file
    initSound(src) {
      let sound = new Pizzicato.Sound(src, () => {
        sound.loop = true;
        sound.detached = true;
      });
      return sound;
    },
    // Start Midi Frame
    initMidiFrame(padList) {
      let context = new AudioContext();

      this.au_1 = this.initSound(this.pads[padList][0]);
      this.au_2 = this.initSound(this.pads[padList][1]);
      this.au_3 = this.initSound(this.pads[padList][2]);
      this.au_4 = this.initSound(this.pads[padList][3]);

      this.group = new Pizzicato.Group([this.au_1, this.au_2, this.au_3, this.au_4]);
    },
    //  Play Music
    playGroup() {
      this.group.play();
      this.isPause = true;
    },
    //  Pause Music
    pauseGroup() {
      this.group.pause();
      this.isPause = false;
    },
    // Handle Sound Change
    soundChange(change) {
      switch (change.key) {
        case 's':
          change.play ? this.au_1.play() : this.au_1.stop();
          break;
        case 'd':
          change.play ? this.au_2.play() : this.au_2.stop();
          break;
        case 'j':
          change.play ? this.au_3.play() : this.au_3.stop();
          break;
        case 'k':
          change.play ? this.au_4.play() : this.au_4.stop();
          break;
        default:
          break;
      }
    },
    // Effect Change
    effectChange(change) {
      switch (change.effect) {
        case 'Reverb':
          if(change.type === 'up' && this.reverbLevel < 10) {
            this.setEffect('reverbFilter', 9.9999 / 11);
            this.reverbLevel++;
          } else if(change.type === 'down' && this.reverbLevel > 0) {
            this.setEffect('reverbFilter', -9.9999 / 11);
            this.reverbLevel--;
          }
          break;
        case 'Delay':
          if(change.type === 'up' && this.delayLevel < 10) {
            this.setEffect('delayFilter', 1 / 11);
            this.delayLevel++;
          } else if(change.type === 'down' && this.delayLevel > 0) {
            this.setEffect('delayFilter', -1 / 11);
            this.delayLevel--;
          }
          break;
        case 'Low Pass':
          if(change.type === 'up' && this.lowPassLevel < 10) {
            this.setEffect('lowPassFilter', 22040 / 11);
            this.lowPassLevel++;
          } else if(change.type === 'down' && this.lowPassLevel > 0) {
            this.setEffect('lowPassFilter', -22040 / 11);
            this.lowPassLevel--;
          }
          break;
        default:
          break;
      }
    },
    // CHANGE TIME FOR REVERB AND DELAY AND FREQUENCY FOR LOWPASS
    setEffect(effect, step) {
      let minValues = {
        'reverbFilter': 0.0001,
        'delayFilter': 0,
        'lowPassFilter': 10
      };
      let fixedNums = {
        'reverbFilter': 4,
        'delayFilter': 1,
        'lowPassFilter': 0
      };
      let opt = effect === 'lowPassFilter' ? 'frequency' : 'time';
      if(this[effect][opt] > minValues[effect]) this.group.removeEffect(this[effect]);
      let val = (this[effect][opt] + step);
      this[effect][opt] = Number(val.toFixed(fixedNums[effect]));
      this[effect][opt] = {...this[effect][opt]};
      console.log(this[effect][opt]);
      if(this[effect][opt] > minValues[effect]) this.group.addEffect(this[effect]);
    }
  }
});
