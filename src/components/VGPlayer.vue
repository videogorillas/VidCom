<template>
    <div>
        <div ref="container" id="container"></div>
        <div ref="overlay" id="overlay">
            <slot name="overlay"></slot>
        </div>
    </div>
</template>

<script>
    const VG = require("@sysval/vgplayer-core");

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
            url: String,
        },
        mounted: function () {
            const player = new VG.Player(this.$refs.container, {hotkeys: this.$props.hotkeys});
            const video = this.$refs.container.querySelector("video");

            video.addEventListener("resize", () => {
                resizeOverlay(this.$refs.overlay, video);
                this.$emit("videoSize", video.videoWidth, video.videoHeight);
            });

            video.controls = true;

            video.addEventListener("click", (e) => {
                e.stopPropagation();
            });

            video.addEventListener("focus", () => {
                video.blur();
            });

            player.loadUrl(this.$props.url, (err) => {
                this.$emit("loadUrl", err);
            });

            player.addEventListener("error", (err) => {
                this.$emit("error", err);
            });

            player.addEventListener("load", (player) => {
                this.$emit("load", player);

                let lastFrame = -1;
                const update = function(self) {
                    window.requestAnimationFrame(update.bind(self, self));
                    if (lastFrame === player.getCurrentFrame()) {
                        return;
                    }
                    lastFrame = player.getCurrentFrame();
                    self.$emit("frameChange", player.getCurrentFrame());
                };
                window.requestAnimationFrame(update.bind(this, this));
            });

            player.addEventListener("timeupdate", (ts) => {
                this.$emit("timeupdate", ts);
            });

            window.addEventListener("resize", () => {
                resizeOverlay(this.$refs.overlay, video); //TODO: remove listener
            });
        }
    }
</script>

<style scoped>
    #overlay {
        position: absolute;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        pointer-events: none;
    }

    #container {
        position: absolute;
        background: black;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
    }
</style>

<style>
    .vg_playerContainer, .vg_embed-container, .vg_player {
        width: 100%;
        height: 100%;
    }

    .vg_player_opacity_0 {
        pointer-events: none;
    }
</style>