/*
ftrack(track_full,width_full,height_full) => ???
*/
function get_full_environment_camera_for(ftrack){
    return navigator.mediaDevices.getUserMedia(
        {
            audio:false,
            video:{
                width:{ ideal:3840 },
                height:{ ideal:2160 },
                facingMode:{ exact:"environment" }
            }
        }
    ).then(
        (stream) => {
            let track = stream.getVideoTracks()[0];
            let cap = track.getCapabilities();
            let width_full = cap.width?.max;
            let height_full = cap.height?.max;
            if(
                width_full !== undefined &&
                height_full !== undefined
            ){
                stream.getTracks().forEach(t => t.stop());
                
                return navigator.mediaDevices.getUserMedia(
                    {
                        audio:false,
                        video:{
                            width:{ exact: width_full },
                            height:{ exact: height_full },
                            facingMode:{ exact:"environment" }
                        }
                    }
                ).then(
                    (stream_full) => {
                        let track_full = stream_full.getVideoTracks()[0];
                        return track_full.applyConstraints(
                            {
                                advanced: [{
                                    zoom: 1.0,
                                    whiteBalanceMode: "continuous",
                                    exposureMode: "continuous",
                                    focusMode: "continuous"
                                }]
                            }
                        ).then(
                            () => {
                                return ftrack(track_full,width_full,height_full);
                            }
                        );
                    }
                );
            }else{
                return Promise.reject(
                    "Failed apply constraints to the video stream from camera"
                );
            }
        }
    );
}
