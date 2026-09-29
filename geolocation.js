/*framework by me, cowork with Cluade*/
class geolocation{
  /*
  debug switch: true = alert() diagnostics, false = silent
  */
  static #debug = true;

  static #say(msg){
    if(geolocation.#debug === true){
      alert(`[geolocation]\n${msg}`);
    }
  }

  /*
  original list
  */
  #loc = [];

  /*
  timing info of each request, parallel to #loc
  */
  #meta = [];

  /*
  append Promise of location into original list
  */
  append_loc(){
    const m = { t0: performance.now(), ms: null };
    this.#meta.push(m);
    this.#loc.push(
      new Promise(
        (resolve, reject) => {
          if (navigator.geolocation === undefined){
            m.ms = 0;
            reject(
              new Error("unable to locate")
            );
          }else{
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                m.ms = performance.now() - m.t0;
                resolve(pos);
              },
              (err) => {
                m.ms = performance.now() - m.t0;
                reject(err);
              },
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
  return Promise of png_blob
  */
  using_loc(png_blob){
    let clone = Array.from(this.#loc);
    let meta = Array.from(this.#meta);
    return Promise.all(
      [
        Promise.allSettled(clone),
        geolocation.#permission()
      ]
    ).then(
      ([locs, perm]) => {
        geolocation.#report(locs, meta, perm);
        return this.#write_loc(locs,png_blob);
      }
    );
  }

  /*
  clear original list
  */
  clear_loc(){
    this.#loc = [];
    this.#meta = [];
  }

  /*
  really writer,
  exactly 2 requests and both fulfilled: write their midpoint into png_blob
  otherwise: png_blob unchanged
  always return Promise of png_blob
  */
  async #write_loc(locs,png_blob){
    if (locs.length !== 2){
      geolocation.#say(`NOT written: requests = ${locs.length} (need exactly 2)`);
      return png_blob;
    }
    if (!locs.every((r) => r.status === "fulfilled")){
      geolocation.#say("NOT written: at least one request failed");
      return png_blob;
    }

    // great-circle midpoint: add the two unit vectors, convert back
    const a = locs[0].value.coords;
    const b = locs[1].value.coords;
    const p = geolocation.#to_xyz(a.latitude, a.longitude);
    const q = geolocation.#to_xyz(b.latitude, b.longitude);
    const x = p[0] + q[0];
    const y = p[1] + q[1];
    const z = p[2] + q[2];
    if (Math.hypot(x, y, z) < 1e-12){
      geolocation.#say("NOT written: antipodal points, no unique midpoint");
      return png_blob;
    }
    const [lat, lon] = geolocation.#to_lat_lon(x, y, z);

    const src = new Uint8Array(await png_blob.arrayBuffer());
    if (!geolocation.#is_png(src)){
      geolocation.#say(
        `NOT written: not a png (type=${png_blob.type}, size=${png_blob.size})`
      );
      throw new Error("not a png");
    }

    const chunk = geolocation.#make_exif_chunk(lat, lon);
    const at = 33;  // 8 (signature) + 25 (IHDR chunk)
    const out = new Uint8Array(src.length + chunk.length);
    out.set(src.subarray(0, at), 0);
    out.set(chunk, at);
    out.set(src.subarray(at), at + chunk.length);

    geolocation.#say(
      `WRITTEN: ${lat.toFixed(7)}, ${lon.toFixed(7)}\n` +
      `size ${src.length} -> ${out.length} bytes`
    );
    return new Blob([out], { type: "image/png" });
  }

  /* ================= debug helpers ================= */

  /*
  Promise of permission state: "granted" / "prompt" / "denied" / "n/a" / "error:..."
  */
  static #permission(){
    const q = navigator.permissions?.query({ name: "geolocation" });
    return q === undefined
      ? Promise.resolve("n/a")
      : q.then((s) => s.state).catch((e) => `error:${e}`);
  }

  /*
  one alert with the result of every request
  */
  static #report(locs, meta, perm){
    const lines = locs.map(
      (r, i) => {
        const ms = meta[i]?.ms;
        const t = (ms === null || ms === undefined) ? "?" : Math.round(ms);
        if (r.status === "fulfilled"){
          const c = r.value.coords;
          return `#${i} OK ${t}ms ` +
                 `${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)} ` +
                 `±${Math.round(c.accuracy)}m`;
        }else{
          const e = r.reason;
          return `#${i} FAIL ${t}ms code=${e?.code} ${e?.message ?? e}`;
        }
      }
    );
    geolocation.#say(
      `secure=${window.isSecureContext} permission=${perm}\n` +
      `requests=${locs.length}\n` +
      (lines.join("\n") || "(empty)") +
      `\n\ncode: 1=denied 2=unavailable 3=timeout`
    );
  }

  /* ================= helpers ================= */

  /*
  lat/lon (decimal degrees) -> unit vector from the earth's center
  */
  static #to_xyz(lat, lon){
    const r = Math.PI / 180;
    return [
      Math.cos(lat * r) * Math.cos(lon * r),
      Math.cos(lat * r) * Math.sin(lon * r),
      Math.sin(lat * r),
    ];
  }

  /*
  vector (any length) -> [lat, lon] in decimal degrees
  */
  static #to_lat_lon(x, y, z){
    const d = 180 / Math.PI;
    return [
      Math.atan2(z, Math.hypot(x, y)) * d,
      Math.atan2(y, x) * d,
    ];
  }

  /*
  128-byte TIFF template (little-endian, GPS only)
  variable bytes: 36 lat ref, 60 lon ref, 80..127 lat/lon dms
  */
  static #tpl = new Uint8Array([
    0x49,0x49, 0x2A,0x00, 0x08,0,0,0,
    0x01,0x00, 0x25,0x88, 0x04,0x00, 0x01,0,0,0, 0x1A,0,0,0, 0,0,0,0,
    0x04,0x00,
    0x01,0x00, 0x02,0x00, 0x02,0,0,0, 0x4E,0,0,0,
    0x02,0x00, 0x05,0x00, 0x03,0,0,0, 0x50,0,0,0,
    0x03,0x00, 0x02,0x00, 0x02,0,0,0, 0x45,0,0,0,
    0x04,0x00, 0x05,0x00, 0x03,0,0,0, 0x68,0,0,0,
    0,0,0,0,
    ...new Uint8Array(48)
  ]);

  /*
  CRC32 lookup table
  */
  static #crc_table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++){
      let c = n;
      for (let k = 0; k < 8; k++){
        c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c >>> 0;
    }
    return t;
  })();

  static #crc32(bytes){
    let c = 0xFFFFFFFF;
    for (const b of bytes){
      c = geolocation.#crc_table[(c ^ b) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  static #is_png(bytes){
    const sig = [0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A];
    return sig.every((b, i) => bytes[i] === b);
  }

  /*
  build 128-byte TIFF block from decimal degrees
  */
  static #make_tiff(lat, lon){
    const t = geolocation.#tpl.slice();
    const dv = new DataView(t.buffer);
    t[36] = lat >= 0 ? 0x4E : 0x53;  // N / S
    t[60] = lon >= 0 ? 0x45 : 0x57;  // E / W
    const put = (base, v) => {
      v = Math.abs(v);
      const d = Math.floor(v);
      const m = Math.floor((v - d) * 60);
      const s = Math.round(((v - d) * 60 - m) * 60 * 10000);
      [[d, 1], [m, 1], [s, 10000]].forEach(([n, den], i) => {
        dv.setUint32(base + i * 8, n, true);
        dv.setUint32(base + i * 8 + 4, den, true);
      });
    };
    put(80, lat);
    put(104, lon);
    return t;
  }

  /*
  eXIf chunk: length(4) + "eXIf" + tiff + crc(4)
  */
  static #make_exif_chunk(lat, lon){
    const tiff = geolocation.#make_tiff(lat, lon);
    const chunk = new Uint8Array(12 + tiff.length);
    const dv = new DataView(chunk.buffer);
    dv.setUint32(0, tiff.length);
    chunk.set([0x65,0x58,0x49,0x66], 4);
    chunk.set(tiff, 8);
    dv.setUint32(
      8 + tiff.length,
      geolocation.#crc32(chunk.subarray(4, 8 + tiff.length))
    );
    return chunk;
  }

}
