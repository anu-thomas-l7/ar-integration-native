import {View, Text, Image, ScrollView, Pressable, FlatList} from 'react-native';
import React, {useEffect, useState} from 'react';

import {ProductStore} from '../store/product';
import styles from '../styles';
import {observer} from 'mobx-react';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faHeart} from '@fortawesome/free-regular-svg-icons';
import StarRating from 'react-native-star-rating-widget';

export const ProductGrid = observer(({searchText, navigation, byCategory}) => {
  const [rating, setRating] = useState(0);
  const {
    state: {searchedProducts, category},
    setProduct,
    getSearchedProducts,
    getProductsByCategories,
    addToWishlist,
  } = ProductStore;
  const [liked, setLiked] = useState(false);
  useEffect(() => {
    byCategory
      ? getProductsByCategories(category)
      : getSearchedProducts(searchText);
  }, [category]);

  console.log('CategoryData: ', searchedProducts);

  return (
    <View>
      {!byCategory && (
        <Text style={styles.searchText}>
          {searchedProducts.length === 0 && 'no'} search results for "
          {searchText}"
        </Text>
      )}
      {/* <ScrollView contentContainerStyle={styles.productGrid}> */}
      <FlatList
        contentContainerStyle={styles.productGrid}
        columnWrapperStyle={{gap: 20}}
        numColumns={2}
        data={searchedProducts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => {
          return (
            <Pressable
              onPress={() => {
                setProduct(x);
                navigation.navigate('Product');
              }}
              key={index}
              style={styles.sliderItem}>
              <Image style={styles.sliderImg} source={{uri: item.imgs[0]}} />

              <Text style={styles.sliderText} numberOfLines={1}>
                {item.name}
              </Text>
              <Text numberOfLines={1}>{item.name}</Text>
              <Text style={{color: 'grey'}}>{item.color}</Text>

              <StarRating
                enableSwiping={true}
                rating={item.rating}
                onChange={setRating}
                starSize={15}
                color="#000"
                style={{marginLeft: -6}}
              />

              <Text style={styles.sliderPrice}>${item.price}</Text>

              <View
                style={{
                  height: 30,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'lightgrey',
                  marginVertical: 4,
                }}>
                <Image
                  source={require('../../assets/icons/truck.png')}
                  style={{
                    width: 20,
                    resizeMode: 'contain',
                    marginHorizontal: 6,
                  }}
                />
                <Text style={{fontSize: 11}}>{item.shipping}</Text>
              </View>

              <View
                style={{
                  height: 30,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  backgroundColor: 'lightgrey',
                  marginVertical: 4,
                }}>
                <Image
                  source={require('../../assets/icons/warehouse.png')}
                  style={{
                    width: 20,
                    resizeMode: 'contain',
                    marginHorizontal: 6,
                  }}
                />
                <Text style={{fontSize: 11}}>{item.pickup}</Text>
              </View>

              <View
                style={{
                  height: 30,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  backgroundColor: 'lightgrey',
                  marginVertical: 4,
                }}>
                <Image
                  source={require('../../assets/icons/delivery-time.png')}
                  style={{
                    width: 20,
                    resizeMode: 'contain',
                    marginHorizontal: 6,
                  }}
                />
                <Text style={{fontSize: 11}}>{item.delivery}</Text>
              </View>

              <Pressable
                onPress={() => addToWishlist(product)}
                style={{
                  position: 'absolute',
                  width: 35,
                  height: 35,
                  padding: 10,
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 50,
                  top: 12,
                  left: 140,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <FontAwesomeIcon
                  style={{color: 'red'}}
                  icon={liked ? faHeartFilled : faHeart}
                />
              </Pressable>
            </Pressable>
          );
        }}
      />
      {/* {searchedProducts.map((x, i) => (
          <Pressable
            onPress={() => {
              setProduct(x);
              navigation.navigate('Product');
            }}
            key={i}
            style={styles.sliderItem}>
            <Image style={styles.sliderImg} source={{uri: x.imgs[0]}} />

            <Text style={styles.sliderText} numberOfLines={1}>
              {x.name}
            </Text>
            <Text numberOfLines={1}>{x.name}</Text>
            <Text style={{color: 'grey'}}>{x.color}</Text>

            <StarRating
              enableSwiping={true}
              rating={x.rating}
              onChange={setRating}
              starSize={15}
              color="#000"
              style={{marginLeft: -6}}
            />

            <Text style={styles.sliderPrice}>${x.price}</Text>

            <View
              style={{
                height: 30,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'lightgrey',
                marginVertical: 4,
              }}>
              <Image
                source={require('../../assets/icons/truck.png')}
                style={{width: 20, resizeMode: 'contain', marginHorizontal: 6}}
              />
              <Text style={{fontSize: 11}}>{x.shipping}</Text>
            </View>

            <View
              style={{
                height: 30,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                backgroundColor: 'lightgrey',
                marginVertical: 4,
              }}>
              <Image
                source={require('../../assets/icons/warehouse.png')}
                style={{width: 20, resizeMode: 'contain', marginHorizontal: 6}}
              />
              <Text style={{fontSize: 11}}>{x.pickup}</Text>
            </View>

            <View
              style={{
                height: 30,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                backgroundColor: 'lightgrey',
                marginVertical: 4,
              }}>
              <Image
                source={require('../../assets/icons/delivery-time.png')}
                style={{width: 20, resizeMode: 'contain', marginHorizontal: 6}}
              />
              <Text style={{fontSize: 11}}>{x.delivery}</Text>
            </View>

            <Pressable
              onPress={() => addToWishlist(product)}
              style={{
                position: 'absolute',
                width: 35,
                height: 35,
                padding: 10,
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 50,
                top: 12,
                left: 110,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <FontAwesomeIcon
                style={{color: 'red'}}
                icon={liked ? faHeartFilled : faHeart}
              />
            </Pressable>
          </Pressable>
        ))} */}

      <View style={{height: 350}}></View>
      {/* </ScrollView> */}
    </View>
  );
});
