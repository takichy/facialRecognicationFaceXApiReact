import React from 'react';
import { Container, Content, List, ListItem, Left, Body, Right, Thumbnail, Text } from 'native-base';
import { myDb } from '../db';

export default class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: 'List of people',
  };

  state = {
    list: [],
    isFocused: false
  }

  componentDidMount() {
    const {navigation} = this.props;
    this.subs = [
      navigation.addListener('didFocus', () => this.setState({ isFocused: true }, () => this.setListData())),
      navigation.addListener('willBlur', () => this.setState({ isFocused: false })),
    ];
  }

  setListData() {
    myDb.transaction(
      tx => {
        tx.executeSql('select * from people', [], (_, { rows: { _array } }) => {
          this.setState({ list: _array})
        });
      },
      (e) => { console.error(e)}
    );
  }

  componentWillUnmount() {
    if(this.subs) {
      this.subs.forEach(sub => sub.remove());
    }
  }

  render() {
    return (
      <Container>
        <Content>
          <List>
            {
              this.state.list.map(person => (
                <ListItem key={person.id} avatar>
                  <Left>
                    <Thumbnail source={{ uri: person.image }} />
                  </Left>
                  <Body>
                    <Text>{`${person.firstName} ${person.lastName}`}</Text>
                    <Text note>{person.address}</Text>
                    <Text note>{person.city}</Text>
                    <Text note>{person.country}</Text>
                  </Body>
                  <Right>
                    <Text note>{person.phone}</Text>
                  </Right>
                </ListItem>
              ))
            }
          </List>
        </Content>
      </Container>
    )
  }
}
