/*framework by me, cowork with Cluade*/
class geolocation{
  /*
  original list
  */
  #loc = [];

  /*
  append Promise of location into original list
  */
  append_loc(){
    this.#loc.push(
      new Promise(
        (resolve, reject) => {
          if (navigator.geolocation === undefined){
            reject(
              new Error("unable to locate")
            );
          }else{
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 3000,
                maximumAge: 0,
              }
            );
          }
        }
      )
    );
  }

  /*
  write summary location of locs into png_blob
  */
  using_loc(png_blob){
    let clone = Array.from(this.#loc);
    return Promise.allSettled(clone).then(
      (locs) => this.write_loc(locs,png_blob)
    );
  }

  /*
  clear original list
  */
  clear_loc(){
    this.#loc = [];
  }

  /*
  really writer,
  return modified png_blob
  */
  write_loc(locs,png_blob){
    
  }
  
}
