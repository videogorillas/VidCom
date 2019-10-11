<template>
  <div ref="app" id="app">
    <div class="timecode">{{timecode}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{frame}}</div>
    <VGPlayer class="hires"
              ref="hires"
              :url="`${url1}`"
              v-bind:hotkeys="true"
              v-on:frameChange="onFrameChange"
              v-on:play="onPlay"/>
    <div class="divider"
         v-bind:style="{left: slider + `%`}"></div>
    <div class="lowres"
         v-bind:style="{webkitClipPath: `inset(0 0 0 ` + slider + `%)`}">
      <VGPlayer ref="lores"
                :url="`${url2}`"
                v-on:frameChange="onLowresFrameChange"
                v-bind:controls="false"/>
    </div>
  </div>
</template>

<script>
import VGPlayer from "@/components/VGPlayer";

export default {
  name: 'app',
  components: {
    VGPlayer,
  },
  data: () => {
    return {
      publicPath: process.env.BASE_URL,
      url1: "",
      url2: "",
      slider: 50,
      frame: 0,
      frameLowres: 0,
      timecode: ""
    }
  },
  methods: {
    onPlay: function(isPlaying) {
      if (!isPlaying) {
        this.onFrameChange(this.$refs.hires.getFrame());
      }
    },
    onLowresFrameChange: function(frame) {
      this.frameLowres = frame;
    },
    onFrameChange: function(frame) {
      this.frame = frame;
      this.timecode = this.$refs.hires.getTapeTimecode();
      if (this.$refs.hires.isPlaying()) {
        return;
      }
      this.$refs.lores.seekFrame(frame);
    },
    updateSlider: function(e) {
      this.slider = e.clientX / document.body.clientWidth * 100;
    }
  },
  mounted: function() {
    this.url1 = window.url1 || "video1.mp4";
    this.url2 = window.url2 || "video2.mp4";

    this.$refs.hires.video.addEventListener("click", (e) => {
      e.preventDefault();
    });
    this.$refs.app.addEventListener("mousemove", (e) => {
      if (this.sliding) {
        this.updateSlider(e);
      }
    });
    this.$refs.app.addEventListener("mouseup", (e) => {
      this.sliding = false;
      this.updateSlider(e);
    });
    this.$refs.app.addEventListener("mousedown", (e) => {
      this.sliding = true;
      this.updateSlider(e);
    });
  }
}
</script>

<style>
  body, html {
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    background-color: black;
  }

  .divider {
    position: fixed;
    width: 1px;
    border-left: 1px solid black;
    height: 100%;
    z-index: 1;
  }
  .hires video::-webkit-media-controls {
    z-index: 2;
  }

  .timecode {
    transform: translateX(-50%);
    position: fixed;
    left: 50%;
    top: 50px;
    padding: 5px;
    background: black;
    color: white;
    z-index: 2;
    font-family: monospace;
    vertical-align: middle;
    min-width: 50px;
  }

  .timecode span {
    display: block;
    font-size: 8px;
    vertical-align: middle;
  }

  .lowres {
    position: fixed;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
