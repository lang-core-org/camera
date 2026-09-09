/* framework by me, finished by Claude */
class vr{
    #canvas;
    #context;
    #width;
    #height;
    #half_width;

    constructor(canvas,width,height){
        this.#width = width;
        this.#height = height;
        this.#half_width = this.#width / 2;
        if(
            Number.isInteger(this.#width) === false ||
            Number.isInteger(this.#height) === false ||
            Number.isInteger(this.#half_width) === false
        ){
            throw new Error("unsupported size!");
        }else{
            this.#canvas = canvas;
            this.#context = this.#canvas?.getContext?.(
                "2d",
                {
                    alpha: false,
                    colorSpace: "display-p3",
                    colorType: "float16",
                    desynchronized: true
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

    draw(left_x_start,right_x_start){
        if(
             Number.isInteger(left_x_start) &&
             Number.isInteger(right_x_start) &&
             0 <= left_x_start &&
             left_x_start + this.#half_width <= this.#width &&
             0 <= right_x_start &&
            right_x_start + this.#half_width <= this.#width
        ){
            return (image_bit_map_left,image_bit_map_right) => {
                if(
                    [image_bit_map_left,image_bit_map_right].every(
                        (tex) =>
                            tex instanceof ImageBitmap &&
                            tex.width === this.#width &&
                            tex.height === this.#height
                    )
                ){
                    this.#context.drawImage(
                        image_bit_map_left,
                        left_x_start, 0,
                        this.#half_width, this.#height,
                        0, 0,
                        this.#half_width, this.#height
                    );
                    this.#context.drawImage(
                        image_bit_map_right,
                        right_x_start, 0,
                        this.#half_width, this.#height,
                        this.#half_width, 0,
                        this.#half_width, this.#height
                    );
                }else{
                    console.error(
                        "texture is not ImageBitmap or has different size"
                    );
                }
            };
        }else{
            throw new Error(
                "left_x_start or right_x_start is illegal"
            );
        }
    }
}
