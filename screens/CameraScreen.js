import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Camera, Permissions } from 'expo';
import distance from 'euclidean-distance';
import { Container, Content, List, ListItem, Left, Body, Right, Thumbnail, Spinner } from 'native-base';
import faceDetector from '../api';
import { myDb } from '../db';

export default class CameraExample extends React.Component {
  static navigationOptions = {
    title: 'Take a picture of the person & we will try to find a match',
  };

  state = {
    hasCameraPermission: null,
    type: Camera.Constants.Type.back,
    comparing: false,
    match: null,
    distance: null
  };

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    const {navigation} = this.props;
    this.setState({ hasCameraPermission: status === 'granted' });
    this.subs = [
      navigation.addListener('didFocus', () => this.setState({ comparing: false })),
      navigation.addListener('willBlur', () => this.setState({ comparing: true, match: null, distance: null })),
    ];
  }

  componentWillUnmount() {
    if(this.subs) {
      this.subs.forEach(sub => sub.remove());
    }
  }

  snap = async () => {
    if (this.camera) {
      const photo = await this.camera.takePictureAsync();
      await this.setState({ comparing: true, match: null });

      const res = await faceDetector(photo.uri);
      const vectorArray = JSON.parse(res._response).vector.__ndarray__;
      this.isMathData(vectorArray);
    }
  };

  isMathData(vectorArray) {
    let match = null;
    myDb.transaction(
      tx => {
        tx.executeSql('select * from people', [], (_, { rows: { _array } }) => {
          let minDistance = 0.5;

          _array.forEach(val => {
            try {
              const distanceFace = distance(vectorArray, JSON.parse(val.facePhoto));
              const mini = Math.min(minDistance, distanceFace);

              if(mini < minDistance) {
                minDistance = mini;
                match = val;
              }
            } catch (e) {
              console.log(e);
            }
          });

          if(match !== null) {
            this.setState({ match, comparing: false, distance: minDistance });
          } else {
            this.setState({ match: false, comparing: false, distance: minDistance });
          }
        });
      },
      (e) => { console.error(e) }
    );
  }

  render() {
    const { hasCameraPermission, comparing, type, match, distance } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else if (comparing === true) {
      return <View>
        <Text>Calculating...</Text>
        <Spinner />
      </View>;
    } else if (match === false || distance >= 0.5) {
      return <Container>
      <Content>
        <Text>No Match Found</Text>
        <Text>the distance is greater than 0.5</Text>
      </Content>
    </Container>;
    } else if (match !== null && distance < 0.5) {
      return <Container>
      <Content>
        <Text>Match Found</Text>
        <Text>the distance is : {distance}</Text>
        <List>
          <ListItem key={match.id} avatar>
            <Left>
              <Thumbnail source={{ uri: match.image }} />
            </Left>
            <Body>
              <Text>{`${match.firstName} ${match.lastName}`}</Text>
              <Text note>{match.address}</Text>
              <Text note>{match.city}</Text>
              <Text note>{match.country}</Text>
            </Body>
            <Right>
              <Text note>{match.phone}</Text>
            </Right>
          </ListItem>
        </List>
      </Content>
    </Container>;
    } else {
      return (
        <View style={{ flex: 1 }}>
          <Camera 
            style={{ flex: 1 }} 
            ratio='16:9'
            type={type} 
            ref={ref => { this.camera = ref; }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                flexDirection: 'row',
              }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignSelf: 'flex-end',
                  alignItems: 'center',
                }}
                onPress={this.snap}>
                <Text
                  style={{ fontSize: 18, marginBottom: 10, color: 'white' }}>
                  {' '}Take Photo{' '}
                </Text>
              </TouchableOpacity>
            </View>
          </Camera>
        </View>
      );
    }
  }
}