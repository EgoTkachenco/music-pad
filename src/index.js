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
      // this.$emit('action', { key: this.keyName, play: false });
    }
  },
  created() {
    window.addEventListener('keydown', event => {
      if(event.key === this.keyName && !this.isPlay) {
        this.playSound();
      }
    });
    window.addEventListener('keyup', event => {
      if(event.key === this.keyName && this.isPlay) {
        this.stopSound();
      }
    });
  },
});

new Vue({
  el: '#midi-frame',
  data: () => ({
    pads: [
        [
          '/audio/bass/bass_1.wav', 
          '/audio/bass/bass_2.wav', 
          '/audio/bass/bass_3.wav', 
          '/audio/bass/bass_4.wav'
        ],
        [
          '/audio/drum/drum_1.wav', 
          '/audio/drum/drum_2.wav', 
          '/audio/drum/drum_3.wav', 
          '/audio/drum/drum_4.wav'
        ],
        [
          '/audio/piano/piano_1.wav', 
          '/audio/piano/piano_2.wav', 
          '/audio/piano/piano_3.wav', 
          '/audio/piano/piano_4.wav'
        ],
    ],
    activePads: 0,

    loopTime: 4000,
    group: null,
    isInited: false,

    isWantToRecord: false,
    isRecording: false,
    recordStart: null,
    record: {
      interval: null,
      sounds: [],
      effects: [],
      start: null
    },
    loops: [],

    isMetronom: false,
    metronom: null,

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
      return new Pizzicato.Sound(src);
    },
    // Start Midi Frame
    initMidiFrame() {
      let context = new AudioContext();

      this.au_1 = this.initSound(this.pads[this.activePads][0]);
      this.au_2 = this.initSound(this.pads[this.activePads][1]);
      this.au_3 = this.initSound(this.pads[this.activePads][2]);
      this.au_4 = this.initSound(this.pads[this.activePads][3]);

      this.group = new Pizzicato.Group([this.au_1, this.au_2, this.au_3, this.au_4]);
      this.isInited = true;
    },
    // Handle Sound Change
    soundChange(change) {
      let au;
      switch (change.key) {
        case 'q':
          this.au_1.stop();
          this.au_1.play();
          au = this.au_1.clone();
          break;
        case 'w':
          this.au_2.stop();
          this.au_2.play();
          au = this.au_2.clone();
          break;
        case 'a':
          this.au_3.stop();
          this.au_3.play();
          au = this.au_3.clone();
          break;
        case 's':
          this.au_4.stop();
          this.au_4.play();
          au = this.au_4.clone();
          break;
        default:
          break;
      }
      if(this.isRecording) {
        this.record.sounds.push({
          au,
          time: new Date().getTime() - this.recordStart,
        })
      }
    },
    // Effect Change
    effectChange(change) {
      let value;
      switch (change.effect) {
        case 'Reverb':
          if(change.type === 'up' && this.reverbLevel < 10) {
            this.setEffect('reverbFilter', 9.9999 / 11);
            this.reverbLevel++;
          } else if(change.type === 'down' && this.reverbLevel > 0) {
            this.setEffect('reverbFilter', -9.9999 / 11);
            this.reverbLevel--;
          }
          value = this.reverbFilter.time;
          break;
        case 'Delay':
          if(change.type === 'up' && this.delayLevel < 10) {
            this.setEffect('delayFilter', 1 / 11);
            this.delayLevel++;
          } else if(change.type === 'down' && this.delayLevel > 0) {
            this.setEffect('delayFilter', -1 / 11);
            this.delayLevel--;
          }
          value = this.delayFilter.time;
          break;
        case 'Low Pass':
          if(change.type === 'up' && this.lowPassLevel < 10) {
            this.setEffect('lowPassFilter', 22040 / 11);
            this.lowPassLevel++;
          } else if(change.type === 'down' && this.lowPassLevel > 0) {
            this.setEffect('lowPassFilter', -22040 / 11);
            this.lowPassLevel--;
          }
          value = this.lowPassFilter.frequency;
          break;
        default:
          break;
      }
      if(this.isRecording) {
        this.record.effects.push({
          key: change.effect,
          value,
          time: new Date().getTime() - this.recordStart,
        })
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
    },
    // Init Record 
    initRecord() {
      if(this.isPause) {
        this.startRecording();
      } else {
        this.isWantToRecord = true;
      }
    },
    // Start record new Loop
    startRecording() {
      this.isRecording = true;
      this.recordStart = new Date().getTime();
      this.record = {
        interval: null,
        sounds: [],
        effects: [],
        start: {
          reverb: this.reverbFilter.time,
          delay: this.delayFilter.time,
          lowPass: this.lowPassFilter.frequency,
        }
      };

      setTimeout(() => {
        this.recordStart = null;
        this.isRecording = false;
        this.pauseLoops();
        this.playLoops();
      }, this.loopTime);
    },
    // Play Loops
    playLoops() {
      this.loops.forEach(loop => {
        loop.interval = setInterval(() => {
          this.pauseLoop(loop);
          this.playLoop(loop);
        }, this.loopTime);
        this.playLoop(loop);
      });

      this.record.interval = setInterval(() => {
        this.pauseLoop(this.record);
        this.playLoop(this.record);

        if(this.isWantToRecord) {
          this.isWantToRecord = false;
          this.startRecording();
        }
      }, this.loopTime);
      this.playLoop(this.record);
      this.isPause = false;
    },
    // Pause Loops
    pauseLoops() {
      this.loops.forEach(loop => {
        clearInterval(loop.interval);
        loop.interval = null;
        this.pauseLoop(loop);
      });
      clearInterval(this.record.interval);
      this.record.interval = null;
      this.pauseLoop(this.record);
      this.isPause = true;
    },
    // Play Loop
    playLoop(loop) {
      if(loop.start) {
        // Init effects for loop 
        let reverb = new Pizzicato.Effects.Reverb({
          time: loop.start.reverb,
          decay: 0.01,
          reverse: false,
          mix: 0.5
        });
        let delay = new Pizzicato.Effects.Delay({
          feedback: 0.6,
          time: loop.start.delay,
          mix: 0.5
        });
        let lowPass = new Pizzicato.Effects.LowPassFilter({
          frequency: loop.start.lowPass,
          peak: 10
        });
        
        let minValues = {
          'reverb': 0.0001,
          'delay': 0,
          'lowPass': 10
        };

        loop.group = new Pizzicato.Group(loop.sounds.map(i => i.au.clone()));

        if(reverb.time > minValues.reverb) loop.group.addEffect(reverb);
        if(delay.time > minValues.delay) loop.group.addEffect(delay);
        if(lowPass.frequency > minValues.lowPass) loop.group.addEffect(lowPass);

        loop.effects.forEach(item => {
          setTimeout(() => {
            console.log('effect')
            switch (item.key) {
              case 'Reverb':
                if(reverb.time > minValues.reverb) loop.group.removeEffect(reverb);
                reverb.time = item.value;
                if(reverb.time > minValues.reverb) loop.group.addEffect(reverb);
                break;
              case 'Delay':
                if(delay.time > minValues.delay) loop.group.removeEffect(delay);
                delay.time = item.value;
                if(delay.time > minValues.delay) loop.group.addEffect(delay);
                break;
              case 'lowPass':
                if(lowPass.frequency > minValues.lowPass) loop.group.removeEffect(lowPass);
                lowPass.frequency = Number(item.value);
                if(lowPass.frequency > minValues.lowPass) loop.group.addEffect(lowPass);
                break;
              default:
                break;
            }
          }, item.time);
        });
        loop.group.sounds.forEach((s, i) => {
            s.play(loop.sounds[i].time / 1000);
        });
      }
    },
    // Pause Loop
    pauseLoop(loop) {
      if(loop.group){
        loop.group.sounds.forEach(s => {s.stop()});
        loop.group = null;
      }
    },
    // Save loop and start new one
    startNewLoop() {
      this.loops.push(this.record);
      this.record = {
        interval: null,
        sounds: [],
        effects: [],
        start: null
      };
      this.pauseLoops();
      this.playLoops();
    },
    // Switch metronom on/off
    switchMetronom() {
      if(this.isMetronom) {
        this.metronom.stop();
        this.isMetronom = false;
      } else {
        this.metronom = new Pizzicato.Sound({
          source: 'wave',
          options: {
            
          }
        });
        this.metronom.play();
        this.isMetronom = true;
      }
    },
    switchPads() {
      if(this.activePads === this.pads.length - 1) {
        this.activePads = 0;
      } else {
        this.activePads++;
      }
      this.initMidiFrame();
    }
  },
  created() {
    window.addEventListener('keydown', event => {
      switch(event.keyCode) {
        // Arrow top
        case 38:
          this.initRecord();
          break;
        // Arrow right
        case 37:
          this.isPause ? this.playLoops() : this.pauseLoops();
          break;
        // Arrow down
        case 40:
          this.startNewLoop();
          break;
      }
    });
  }
});
