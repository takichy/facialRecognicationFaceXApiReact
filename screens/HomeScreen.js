import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Container, Content, Item, Input, Button } from 'native-base';
import { ImagePicker, Permissions } from 'expo';
import { myDb } from '../db';
import faceDetector from '../api';

export default class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Form add person',
  };

  state = {
    hasCameraPermission: null,
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    image: '',
    facePhoto: ''
  }

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    this.setState({ hasCameraPermission: status === 'granted' });

    myDb.transaction(tx => {
      tx.executeSql(
        'create table if not exists people (id integer primary key not null, firstName text, lastName text, phone text, address text, city text, country text, image text, facePhoto text);'
      );
    });
  }

  _pickImage = async (key) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.cancelled) {
      const res = await faceDetector(result.uri);
      const vectorArray = JSON.stringify(JSON.parse(res._response).vector.__ndarray__);
      this.setState({ [key]: vectorArray, image: result.uri });
    }
  };

  validate = () => {
    const { 
      firstName,
      lastName,
      phone,
      address,
      city,
      country,
      image,
      facePhoto
    } = this.state;

    if(this.isValid()) {
      myDb.transaction(
        tx => {
          tx.executeSql('insert into people (firstName, lastName, phone, address, city, country, image, facePhoto) values (?, ?, ?, ?, ?, ?, ?, ?)', [firstName, lastName, phone, address, city, country, image, facePhoto]);

          this.setState({
            firstName: '',
            lastName: '',
            phone: '',
            address: '',
            city: '',
            country: '',
            image: '',
            facePhoto: '',
          })
        },
        (e) => { console.error(e)}
      );
    }
  }

  handleChange = (e, key) => {
    this.setState({ [key]: e })
  }

  isValid = () => {
    return this.state.firstName.length > 0 &&
    this.state.lastName.length > 0 &&
    this.state.phone.length > 0 &&
    this.state.address.length > 0 &&
    this.state.city.length > 0 &&
    this.state.country.length > 0 &&
    this.state.image.length > 0 &&
    this.state.facePhoto.length > 0
  }

  render() {
    const { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
        <View style={styles.container}>
          <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Container>
              <Content>
                <Item rounded style={styles.input}>
                  <Input
                    onChangeText={(term) => this.handleChange(term, 'firstName')} 
                    value={this.state.firstName}
                    placeholder='First name'/>
                </Item>
                <Item rounded style={styles.input}>
                  <Input
                    onChangeText={(term) => this.handleChange(term, 'lastName')} 
                    value={this.state.lastName}
                    placeholder='Last name'/>
                </Item>
                <Item rounded style={styles.input}>
                  <Input
                    onChangeText={(term) => this.handleChange(term, 'phone')} 
                    value={this.state.phone}
                    placeholder='Phone contact'/>
                </Item>
                <Item rounded style={styles.input}>
                  <Input
                    onChangeText={(term) => this.handleChange(term, 'address')} 
                    value={this.state.address}
                    placeholder='Address'/>
                </Item>
                <Item rounded style={styles.input}>
                  <Input
                    onChangeText={(term) => this.handleChange(term, 'city')} 
                    value={this.state.city}
                    placeholder='City'/>
                </Item>
                <Item rounded style={styles.input}>
                  <Input
                    onChangeText={(term) => this.handleChange(term, 'country')} 
                    value={this.state.country}
                    placeholder='Country'/>
                </Item>
                <Item rounded style={styles.input}>
                  <Input
                    placeholder='Face photo'
                    value={this.state.facePhoto}
                    onFocus={() => this._pickImage('facePhoto')}
                  />
                </Item>
              </Content>
            </Container>
          </ScrollView>
          <View style={styles.tabBarInfoContainer}>
            <Button 
              style={styles.button} 
              success={this.isValid()}
              disabled={!this.isValid()}
              onPress={this.validate}
            >
              <Text style={styles.text}>Validate</Text>
            </Button>
          </View>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 30,
  },
  input: {
    padding: 5,
    margin: 5
  },
  tabBarInfoContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    backgroundColor: 'red',
  },
  button: {
    width: '100%',
    justifyContent: 'center',
    borderRadius: 0,
  },
  text: {
    color: '#fff',
  }
});
