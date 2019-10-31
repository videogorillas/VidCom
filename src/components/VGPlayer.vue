<template>
    <div>
        <div ref="container" id="container"></div>
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
        },
        data: function () {
            return {
                player: null,
                video: null,
            }
        },
        mounted: function () {
            this.player = new window.VG.Player(this.$refs.container, {hotkeys: this.$props.hotkeys, theme: "vg"});
            this.video = this.$refs.container.querySelector("video");

            this.player.loadUrl(this.$props.url, (err) => {
                this.$emit("loadUrl", err);
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

            video.addEventListener("resize", () => {
                resizeOverlay(this.$refs.overlay, video);
                this.$emit("videoSize", video.videoWidth, video.videoHeight);
            });

            video.controls = this.$props.controls;

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
                return this.player && this.player.play();
            },
            seekFrame: function(fn) {
                return this.player && this.player.seekFrame(fn);
            },
            getFrame: function() {
                return this.player && this.player.getCurrentFrame();
            },
            getTapeTimecode: function() {
                return this.player && this.player.getCurrentTapeTimecode();
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

    .vg_player_opacity_0 {
        pointer-events: none;
    }

    .vg_time_controls_box, .vg_invisible, .vg_allControls {
        display: none;
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
</style>