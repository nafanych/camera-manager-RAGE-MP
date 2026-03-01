
interface AnimateData {
    position: number[];
    rotParams: number[];
    duration: number;
}

class Camera {
    protected camera: CameraMp | null = null;

    public create(coords: Vector3, rotParams: number[], fov: number): void {
        this.camera = mp.cameras.new(
            'default',
            coords,
            new mp.Vector3(0, 0, 0),
            fov
        );

        this.camera.setActive(true);
        this.camera.setRot(rotParams[0], rotParams[1], rotParams[2], rotParams[3]);
        mp.game.cam.renderScriptCams(true, false, 0, true, false);
    };

    public destroy(): void {
        if (!this.camera || !mp.cameras.exists(this.camera)) return;

        this.camera.destroy();
        this.camera = null;
        mp.game.cam.renderScriptCams(false, false, 0, true, false);
    };

    public setPos(coords: Vector3, rot: number[]): void {
        if (!this.camera || !mp.cameras.exists(this.camera)) return;

        this.camera.setCoord(coords.x, coords.y, coords.z);
        this.camera.setRot(rot[0], rot[1], rot[2], rot[3]);
    };
};

class CameraAnimation extends Camera {

    private renderEvent: ((dt: number) => void) | null = null;
    private animationData: {
        startPos: Vector3;
        startRot: number[];
        endPos: Vector3;
        endRot: number[];
        duration: number;
        startTime: number;
    } | null = null;

    public goAnimate(_data: AnimateData): void {
        if (!this.camera || !mp.cameras.exists(this.camera)) return;

        const data = this.parseData(_data);
        const end = data.position;
        const duration = data.duration;

        const endPos = new mp.Vector3(
            end[0],
            end[1],
            end[2]
        );
        const endRot = data.rotParams;

        const currentPos = this.camera.getCoord();
        const currentRotVec = this.camera.getRot(2);
        const startRot = [currentRotVec.x, currentRotVec.y, currentRotVec.z];

        if (this.vectorsEqual(currentPos, endPos)) return;

        this.animationData = {
            startPos: currentPos,
            startRot,
            endPos,
            endRot,
            duration,
            startTime: Date.now()
        };

        if (!this.renderEvent) {
            this.renderEvent = () => this.onRender();
            mp.events.add('render', this.renderEvent);
        };
    };

    private onRender(): void {
        if (!this.camera || !mp.cameras.exists(this.camera)) return;
        if (!this.animationData) return;

        const { startPos, startRot, endPos, endRot, duration, startTime } = this.animationData;
        const elapsed = Date.now() - startTime;
        let progress = Math.min(elapsed / duration, 1);
        progress = this.easeInOutQuad(progress);

        const interpPos = new mp.Vector3(
            startPos.x + (endPos.x - startPos.x) * progress,
            startPos.y + (endPos.y - startPos.y) * progress,
            startPos.z + (endPos.z - startPos.z) * progress
        );

        const interpRot = new mp.Vector3(
            startRot[0] + (endRot[0] - startRot[0]) * progress,
            startRot[1] + (endRot[1] - startRot[1]) * progress,
            startRot[2] + (endRot[2] - startRot[2]) * progress
        );

        this.camera.setCoord(interpPos.x, interpPos.y, interpPos.z);
        this.camera.setRot(interpRot.x, interpRot.y, interpRot.z, 2);

        if (elapsed >= duration) {
            this.stopAnimation();
        };
    };

    private stopAnimation(): void {
        if (this.renderEvent) {
            mp.events.remove('render', this.renderEvent);
            this.renderEvent = null;
        };

        this.animationData = null;
    };

    public destroy(): void {
        this.stopAnimation();
        super.destroy();
    };

    private parseData(data: AnimateData): AnimateData {
        return typeof data === 'string' ? JSON.parse(data) : data;
    };

    private vectorsEqual(a: Vector3, b: Vector3): boolean {
        return a.x === b.x && a.y === b.y && a.z === b.z;
    };

    private easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };
}


// using
const animation: AnimateData = {
    "position": [400, 500, 200],
    "rotParams": [0, 0, 0, 0],
    "duration": 1500
};

const camera: CameraAnimation = new CameraAnimation();

camera.create(new mp.Vector3(100, 200, 300), [0, 0, 0, 0], 60); // create camera
camera.goAnimate(animation); // animate camera
camera.setPos(new mp.Vector3(100, 200, 300), [0, 0, 0, 0]); // set new position camera
camera.destroy(); // delete camera
