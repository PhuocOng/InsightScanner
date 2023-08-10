import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, Button, Image } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Camera } from 'expo-camera';
import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import axios from 'axios';
import { Buffer } from 'buffer';

export default function App() {
  let DROPBOX_ACCESS_TOKEN = 'sl.Bj2yB0zuacjIPzdNrv7BaE4V0_2rmOxPk-mewG4VWFCGmBICtbZOe9VpAggsyb194i45Zq1hgHJ0ShkgYtvpMe-1HSa-JaPivRQzAG0w-r-wRoW642Ksm_YS99WQBANrd0TsroioB69PsP2iBhpJcDQ'
  let cameraRef = useRef();
  const [hasCameraPermission, setHasCameraPermission] = useState(); //boolean whether has camerapermissiom?
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(); //boolean whether has media linrary permission?
  const [photo, setPhoto] = useState(); // Photo state
  useEffect(() => { //Unlocked all permission through asking user
    (async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      setHasCameraPermission(cameraPermission.status === "granted");
      setHasMediaLibraryPermission(mediaLibraryPermission.status === "granted");
    })();
  }, []);

  if (hasCameraPermission === undefined) {
    return <Text>Requesting permissions...</Text>
  } else if (!hasCameraPermission) {
    return <Text>Permission for camera not granted. Please change this in settings.</Text>
  }

  let takePic = async () => {
    let options = {
      quality: 1,
      base64: true,
      exif: false
    };

    let newPhoto = await cameraRef.current.takePictureAsync(options);
    setPhoto(newPhoto);
  };
  
  const base64ToBinary = (base64Data) => {
    return Buffer.from(base64Data, 'base64');
  };

  const uploadToDropbox = async (base64) => {
    try {
        // Generate a unique name for the file (just as an example)
        let timestamp = new Date().toISOString();
        let path = `/home/img/${timestamp}.jpg`;

        const binaryData = base64ToBinary(base64);

        let response = await axios.post('https://content.dropboxapi.com/2/files/upload', binaryData, {
            headers: {
                'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify({
                    path: path,
                    mode: 'add'
                })
            }
        });

        return path;
    } catch (error) {
        console.error('Failed to upload image to Dropbox:', error);
    }
  };

  const getDropboxLink = async (path) => {
    try {
        let response = await axios.post('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
            path: path
        }, {
            headers: {
                'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.url;
    } catch (error) {
        console.error('Failed to get shared link from Dropbox:', error);
    }
  };

  if (photo) {
    let sharePic = () => {
      shareAsync(photo.uri).then(() => {
        setPhoto(undefined);
      });
    };

    let savePhoto = () => {
      MediaLibrary.saveToLibraryAsync(photo.uri).then(() => {

        setPhoto(undefined);
      });
    };

    
    let scanPhoto = async () => {
      try {
          // Upload the photo to Dropbox
          console.log("now it's scanning")
          let imagePath = await uploadToDropbox(photo.base64);
          console.log("imagePath is:", imagePath)
  
          // Get the shareable link
          let imageUrl = await getDropboxLink(imagePath);
          imageUrl=imageUrl.replace("dl=0", "raw=1") //this is how to convert dropbox img into only img => so backend can process it
          console.log("imageUrl is:", imageUrl)
  
          // Send the image URL to your backend
          let response = await axios.post('http://192.168.1.32:5000/detect-text', {  //We have to update this host when we change wifi by search ipconfig
              image_url: imageUrl
          }, { timeout: 30000})
            .then(response => {
              console.log("response of scan photo is:", response.data)
            })
            .catch(error => {
              console.log("there is an error when scan photo", error)
            });
      } catch (error) {
          console.error('Error scanning the photo:', error.message);
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <Image style={styles.preview} source={{ uri: "data:image/jpg;base64," + photo.base64 }} />
        <Button title="Share" onPress={sharePic} />
        {hasMediaLibraryPermission ? <Button title="Save" onPress={savePhoto} /> : undefined}
        <Button title="Discard" onPress={() => setPhoto(undefined)} />
        <Button title="Scan" onPress={scanPhoto} />

      </SafeAreaView>
    );
  }

  return (
    <Camera style={styles.container} ref={cameraRef}>
      <View style={styles.buttonContainer}>
        <Button title="Take Pic" onPress={takePic} />
      </View>
      <StatusBar style="auto" />
    </Camera>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end'
  },
  preview: {
    alignSelf: 'stretch',
    flex: 1
  }
});
