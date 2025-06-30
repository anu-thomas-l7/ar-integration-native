import React, {useState, useEffect} from 'react';
import {
  View,
  ImageBackground,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import {faSearch} from '@fortawesome/free-solid-svg-icons';
import styles from '../styles';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {observer} from 'mobx-react';
import {ProductStore} from '../store/product';
import {faHeart} from '@fortawesome/free-regular-svg-icons';
export const Categories = observer(() => {
  const [searching, setSearching] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searched, setSearched] = useState(false);
  const [liked, setLiked] = useState(false);
  const handleBackButtonClick = () => {
    setSearching(false);
    setSearchText('');
    setSearched(false);

    return true;
  };

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    return () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    };
  }, []);
  const {
    state: {categories, category},
    setCategory,
    getCategories,
  } = ProductStore;

  useEffect(() => {
    getCategories();
  }, []);

  return (
    <View>
      <View style={styles.searchBar}>
        <TextInput
          value={searchText}
          onChangeText={e => setSearchText(e)}
          height={50}
          style={searching ? styles.searchInputFocused : styles.searchInput}
          onFocus={() => setSearching(true)}
          onBlur={() => setSearching(false)}
          selectionColor="#000"
        />
        <TouchableOpacity
          onPress={() => searchText.length > 0 && setSearched(true)}
          style={styles.searchBtn}>
          <FontAwesomeIcon
            style={{color: '#000', marginRight: 10}}
            icon={faSearch}
          />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal={true} style={styles.categoryList}>
        <Pressable style={styles.category} onPress={() => setCategory(null)}>
          <Text
            style={
              category === null
                ? styles.categoryTextSelected
                : styles.categoryText
            }>
            All
          </Text>
        </Pressable>
        {categories.map((x, i) => (
          <Pressable
            style={styles.category}
            key={i}
            onPress={() => setCategory(x.id)}>
            <Text
              style={
                category && category === x.id
                  ? styles.categoryTextSelected
                  : styles.categoryText
              }>
              {x.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
});
