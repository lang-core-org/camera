/* framework by me, finished by Claude */
class vr{
    #canvas;
    #context;
    #width;
    #height;
    #half_width;
    #x_start;
    #d_right;

    constructor(canvas,width,height){
        this.#width = width;
        this.#height = height;
        this.#half_width = this.#width / 2;
        this.#x_start = this.#half_width / 2;
        this.#d_right = 0;
        if(
            Number.isInteger(this.#width) === false ||
            Number.isInteger(this.#height) === false ||
            Number.isInteger(this.#half_width) === false ||
            Number.isInteger(this.#x_start) === false
        ){
            throw new Error("unsupported size!");
        }else{
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
                this.#canvas.width = this.#width;
                this.#canvas.height = this.#height;
            }
        }
    }

    d_right_plus(dx){
        if(Number.isInteger(dx) === true){
            this.#d_right = Math.min(
                Math.max(
                    this.#d_right + dx,
                    -this.#x_start
                ),
                this.#x_start
            );
        }else{
            throw new Error("d_right_plus required Integer");
        }
    }
    
    draw(img_bitmap_left){
        let fcheck = (tex) => (
            tex instanceof ImageBitmap &&
            tex.width === this.#width &&
            tex.height === this.#height
        );
        if(fcheck(img_bitmap_left)){
            this.#context.drawImage(
                img_bitmap_left,
                this.#x_start, 0,
                this.#half_width, this.#height,
                0, 0, 
                this.#half_width, this.#height
            );
            return (img_bitmap_right) => {
                if(fcheck(img_bitmap_right)){
                    this.#context.drawImage(
                        img_bitmap_right,
                        this.#x_start + this.#d_right,0,
                        this.#half_width,this.#height,
                        this.#half_width, 0, 
                        this.#half_width, this.#height
                    );


                    //draw d_right value on top
                this.#context.font = "48px monospace";
                this.#context.fillStyle = "#0f0";
                this.#context.fillText(
                    `d_right: ${this.#d_right}`,
                    20, 60
                );


                    
                }else{
                    throw new Error("unable to draw right");
                }
            };
        }else{
            throw new Error("unable to draw left");
        }
    }
}
