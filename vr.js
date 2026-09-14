/* framework by me, cowork with Claude & DeepSeek*/
class vr{
    #canvas;
    #context;
    #width;
    #height;
    #half_width;
    #d_right;
    #d_right_lim;
    
    /* return canvas_width if success*/
    auto_vr(){
        let c = new OffscreenCanvas(0, 0);
        let gl = c.getContext("webgl2");
        let lim = gl?.getParameter?.(
            gl?.MAX_TEXTURE_SIZE
        ) ?? Math.min( this.#width, this.#height);

        let canvas_width = 0;
        
        let k = 1;
        let k_lim = 5; //sup lim
        let next_k = (dk) => {
            k = k + dk;
            this.#d_right_lim = this.#width / k;
            this.#d_right = this.#d_right_lim; //suggest value
            this.#half_width = this.#width - this.#d_right_lim;
            canvas_width = this.#half_width * 2;
        };
        
        
        for(
            next_k(1);
            (k <= k_lim) &&
            (canvas_width <= lim);
            next_k(1)
        ){}
        
        for(
            next_k(-1);
            (k !== 1) &&
            Number.isInteger(
                this.#d_right_lim
            ) === false;
            next_k(-1)
        ){}

        if( k === 1){
            throw new Error(
                "Unable to show origin image as SBS VR"
            );
        }else{
            return canvas_width;
        }
    }

    constructor(canvas,width,height){
        this.#width = width;
        this.#height = height;
        if(
            Number.isInteger(this.#width) === false ||
            Number.isInteger(this.#height) === false
        ){
            throw new Error(
                "width/height must be integer"
            );
        }else{
            let canvas_width = this.auto_vr();
            let canvas_height = this.#height;
            
            this.#canvas = canvas;
            this.#context = this.#canvas?.getContext?.(
                "2d",
                {
                    alpha: false,
                    colorSpace: "display-p3",
                    colorType: "float16"
                }
            ) ?? null;
            if(this.#context === null){
                throw new Error("unsupported canvas 2d!");
            }else{
                this.#canvas.width = canvas_width;
                this.#canvas.height = canvas_height;
            }
        }
    }

    d_right_plus(dx){
        if(Number.isInteger(dx) === true){
            this.#d_right = Math.min(
                Math.max(
                    this.#d_right + dx,
                    0
                ),
                this.#d_right_lim
            );
        }else{
            throw new Error("d_right_plus required Integer");
        }
    }

    #fcheck(tex){
        return (
            tex instanceof ImageBitmap &&
            tex.width === this.#width &&
            tex.height === this.#height
        );
    }

    clear(){
        this.#context.clearRect(
            0, 0,
            this.#canvas.width, this.#canvas.height
        );
    }

    draw_left(img_bitmap_left){
        if(this.#fcheck(img_bitmap_left)){
            this.#context.drawImage(
                img_bitmap_left,
                0, 0,
                this.#half_width, this.#height,
                0, 0,
                this.#half_width, this.#height
            );
            return Promise.resolve();
        }else{
            return Promise.reject("unable to draw left");
        }
    }

    draw_right(img_bitmap_right){
        if(this.#fcheck(img_bitmap_right)){
            this.#context.drawImage(
                img_bitmap_right,
                this.#d_right, 0,
                this.#half_width, this.#height,
                this.#half_width, 0,
                this.#half_width, this.#height
            );
            return Promise.resolve();
        }else{
            return Promise.reject("unable to draw right");
        }
    }
    
    save(){
        return new Promise(
            (resolve, reject) => {
                this.#canvas.toBlob(
                    (blob) => {
                        if(blob !== null){
                            let name = 
                                `VR_Image [${new Date().getTime()}]_SBS.png`;
                            let url = URL.createObjectURL(blob);
                            let a = document.createElement('a');
                            a.href = url;
                            a.download = name;
                            a.click();
                            URL.revokeObjectURL(url);
                            resolve();
                        }else{
                            reject("Failed to save photos.");
                        }
                    }, 
                    "image/png"
                )
            }
        );
    }
    
}
