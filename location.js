/*framework by me, cowork with Cluade*/
class location{
  /* foreach element in #loc :
     undefined 
  */
  #loc = [];
  
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

  using_loc(){
    let clone = Array.from(this.#loc);
    this.#loc = [];
    return Promise.allSettled(clone);
  }
}
