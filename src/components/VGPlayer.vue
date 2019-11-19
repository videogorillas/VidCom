<template>
    <div>
        <div ref="container" id="container" v-bind:class="{noControls: !this.controls}"></div>
        <div ref="overlay" id="overlay">
            <slot name="overlay"></slot>
        </div>
    </div>
</template>

<script>
    // eslint-disable-next-line
    import * as _ from "@/vgplayer";

    const resizeOverlay = function(overlay, video) {
        const ar = video.videoWidth / video.videoHeight;
        const width = Math.min(video.clientWidth, video.clientHeight * ar);
        const height = width / ar;
        overlay.style.paddingLeft = overlay.style.paddingRight = (video.clientWidth - width) / 2 + "px";
        overlay.style.paddingTop = overlay.style.paddingBottom = (video.clientHeight - height) / 2 + "px";
    };

    export default {
        name: 'VGPlayer',
        props: {
            hotkeys: {
                type: Boolean,
                required: false,
                default: false,
            },
            controls: {
                type: Boolean,
                required: false,
                default: true,
            },
            url: String,
            subtitles: {
                type: String,
                required: false
            },
            startFrame: {
                type: Number,
                required: false,
                default: 0
            },
            endFrame: {
                type: Number,
                required: false,
                default: -1
            },
            initialFrame: {
                type: Number,
                required: false,
                default: 0
            },
        },
        data: function () {
            return {
                player: null,
                video: null,
                loaded: false,
            }
        },
        mounted: function () {
            this.player = new window.VG.Player(this.$refs.container, {hotkeys: this.$props.hotkeys, theme: "vg"});
            this.video = this.$refs.container.querySelector("video");
            const controlsContainer = this.$refs.container.querySelector(".vg_allControls");

            this.$refs.container.querySelectorAll("video").forEach((videoEl) => {
                videoEl.playsInline = true;
                videoEl.disablePictureInPicture = true;
                videoEl.muted = true;
            });

            this.player.loadUrl(this.$props.url, (err) => {
                this.$emit("loadUrl", err);
                this.loaded = true;
                this.player.seekFrame(this.$props.initialFrame);
                if (this.$props.subtitles) {
                    this.addCaptions(this.$props.subtitles);
                }

                if (this.$props.startFrame > 0 || this.$props.endFrame >= 0) {
                    const endFrame = this.$props.endFrame === -1 ? this.player.getTimeline().getLastFrame() : this.$props.endFrame;
                    this.player.setRange(this.$props.startFrame, endFrame)
                }
            });

            const player = this.player;
            const video = this.video;

            controlsContainer.addEventListener("mousedown", (e) => {
                e.stopPropagation();
            });

            controlsContainer.addEventListener("touchstart", (e) => {
                e.stopPropagation();
            });

            video.addEventListener("resize", () => {
                resizeOverlay(this.$refs.overlay, video);
                this.$emit("videoSize", video.videoWidth, video.videoHeight);
            });

            video.addEventListener("click", (e) => {
                e.stopPropagation();
            });

            video.addEventListener("focus", () => {
                video.blur();
            });

            player.addEventListener("error", (err) => {
                this.$emit("error", err);
            });

            player.addEventListener("load", (player) => {
                this.$emit("load", player);

                player.addEventListener("play", (isPlaying) => {
                    this.$emit("play", isPlaying);
                });

                let lastFrame = -1;
                let isSeeking = false;
                video.addEventListener("seeking", () => {
                    isSeeking = true;
                });
                video.addEventListener("seeked", function (self) {
                    isSeeking = false;
                    self.$emit("frameChange", player.getCurrentFrame());
                }.bind(this, this));
                const update = function(self) {
                    window.requestAnimationFrame(update.bind(self, self));
                    if (lastFrame === player.getCurrentFrame()) {
                        return;
                    }
                    lastFrame = player.getCurrentFrame();
                    if (!isSeeking) {
                        self.$emit("frameChange", player.getCurrentFrame());
                    }
                };
                window.requestAnimationFrame(update.bind(this, this));
            });

            player.addEventListener("timeupdate", (ts) => {
                this.$emit("timeupdate", ts);
            });

            window.addEventListener("resize", () => {
                resizeOverlay(this.$refs.overlay, video); //TODO: remove listener
            });
        },
        methods: {
            play: function() {
                return this.player && this.loaded && this.player.play();
            },
            pause: function() {
                return this.player && this.loaded && this.player.pause();
            },
            seekFrame: function(fn) {
                return this.player && this.loaded && this.player.seekFrame(fn);
            },
            getFrame: function() {
                return this.player && this.loaded && this.player.getCurrentFrame();
            },
            getTapeTimecode: function() {
                return this.player && this.loaded && this.player.getCurrentTapeTimecode();
            },
            isPlaying: function() {
                return this.video && !this.video.paused;
            },
            addCaptions: function(url) {
                const codec = window.VG.Captions.guessSubtitleCodec(url);
                const self = this;
                window.VG.Captions.parseSubs(this.player.getTimeline(), url, codec, function (err, subs) {
                    if (err) {
                        throw ["error parsing subs", err];
                    }
                    self.player.addCaptions(subs);
                })
            }
        }
    }
</script>

<style scoped>
    * {
        user-select: none;
    }

    #overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        pointer-events: none;
    }

    #container {
        background: black;
        margin: 0;
        padding: 0;
        height: 100%;
    }
</style>

<style>
    .vg_player video {
        object-fit: fill;
    }

    .vg_captionText:not(:empty) {
        font-family: monospace;
        position: absolute;
        max-width: 75%;
        padding: 10px;
        font-size: 11px;
        background-color: black;
        color: white;
        bottom: 75px;
        z-index: 2;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
    }

    .vg_playerContainer, .vg_embed-container, .vg_player {
        height: 100%;
    }

    .vg_player_opacity_0 {
        pointer-events: none;
    }

    .vg_time_controls_box, .vg_invisible {
        display: none;
    }

    .vg_allControls {
        display: block;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 40px;
        background-color: rgba(50,50,50,0.7);
        backdrop-filter: blur(2px);
        z-index: 9;
        transition-property: opacity;
        transition-duration: 0.2s;
        opacity: 1;
    }

    .noControls .vg_allControls {
        display: none;
    }

    .vg_time_controls, .vg_proPanel__toggle, .vg_controls--addOn, .vg_timevalues, .vg_proPanel, .vg_playBackButton, .vg_playFasterButton, .vg_proPanel__left, .vg_ddown__content {
        display: none;
    }

    .vg_playPauseButton {
        cursor: pointer;
        filter: invert(1);
        display: block;
        width: 20px;
        height: 20px;
        position: absolute;
        top: 10px;
        left: 10px;
    }

    .vg_icon-play {
        display: block;
        width: 20px;
        height: 20px;
        background: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOHB4IiBoZWlnaHQ9IjE4cHgiIHZpZXdCb3g9IjAgMCAxOCAxOCI+CiAgPHBhdGggZmlsbD0iY29udGV4dC1maWxsIiBkPSJNMy4yNDMsMTUuMTU1YzAsMC44NDUsMC41OTMsMS4xNTcsMS4zMTcsMC43MDdsOS42NTktNi4wNDFjMC43MjctMC40NTMsMC43MjItMS4xOTMsMC0xLjY0NUw0LjU1NiwyLjEzNwogICAgQzMuODI3LDEuNjgyLDMuMjM3LDIuMDE0LDMuMjM3LDIuODQ0djEyLjMxMkgzLjI0M3oiLz4KPC9zdmc+);
    }

    .vg_playing .vg_icon-play {
        background: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOHB4IiBoZWlnaHQ9IjE4cHgiIHZpZXdCb3g9IjAgMCAxOCAxOCI+CiAgPHBhdGggZmlsbD0iY29udGV4dC1maWxsIiBkPSJNNi4wMDIsMS45NTNDNS4xNzIsMS45NTMsNC41LDIuNjI2LDQuNSwzLjQ1NXYxMS4wOAogICAgICAgIGMwLDAuODMsMC42NzIsMS41MDIsMS41MDIsMS41MDJjMC44MjksMCwxLjUwMi0wLjY3MiwxLjUwMi0xLjUwMlYzLjQ1NUM3LjUwNCwyLjYyNiw2LjgzMSwxLjk1Myw2LjAwMiwxLjk1M3ogTTEyLDEuOTUzCiAgICAgICAgYy0wLjgyOCwwLTEuNSwwLjY3Mi0xLjUsMS41djExLjA5NGMwLDAuODI4LDAuNjcyLDEuNSwxLjUsMS41czEuNS0wLjY3MiwxLjUtMS41VjMuNDUzQzEzLjUsMi42MjUsMTIuODI4LDEuOTUzLDEyLDEuOTUzeiIvPgo8L3N2Zz4KCg==);
    }

    .vg_timescrubber__wrap {
        background-color: black;
        display: block;
        position: absolute;
        left: 40px;
        right: 10px;
        top: 15px;
    }

    .vg_scrubber__buffered div {
        background-color: gray;
        display: block;
        position: absolute;
    }

    .vg_scrubber__played {
        background-color: white;
        display: block;
        position: absolute;
    }

    .vg_timescrubber__wrap, .vg_scrubber__buffered div, .vg_scrubber__played {
        height: 10px;
    }
</style>