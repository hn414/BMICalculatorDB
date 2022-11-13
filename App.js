import { StatusBar } from 'expo-status-bar';
import React, { Component } from 'react';
import { useState, useEffect } from "react";
import { StyleSheet, Text, Alert, TextInput, TouchableOpacity, View, ScrollView, SafeAreaView } from 'react-native';
import * as SQLite from "expo-sqlite";
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

const heightKey = '@MyApp:hKey';
const weightKey = '@MyApp:wKey';

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("bmiDB.db");
  return db;
}
const db = openDatabase();
function Items({}) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, date(itemDate) as itemDate, bmi, height, weight from items order by itemDate desc;`,
        [], (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>BMI History</Text>
      {items.map(({ id, itemDate, bmi, weight, height }) => (
        <Text key={id} style={styles.preview1}>{itemDate}:   {bmi} (W: {weight}, H: {height})</Text>
      ))}
    </View>
  );
}

export default function App() {
  const [height, setHeight] = useState(null);
  const [weight, setWeight] = useState(null);
  const [bmi, setBMI] = useState(null);
  const [state, setState] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      // tx.executeSql(
      //   "drop table items;"
      // );
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, itemDate real, bmi real, weight real, height real);"
      );
    });
  }, []);

  const add = () => {
    // is text empty?
    if (height === null || height === "" || weight === null || weight === "") {
      return false;
    }
    const BMI = calBMI();

    if (BMI === null || BMI === ""){
      return false;
    }

    db.transaction(
      (tx) => {
        tx.executeSql("insert into items (itemDate, bmi, weight, height) values (julianday('now'), ?, ?, ?)", [BMI, weight, height]);
        tx.executeSql("select * from items order by itemDate desc", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
    );
  };
  const calBMI = () =>{
    const BMI = (parseFloat((weight / (height * height))) * 703).toFixed(1);
    setBMI(BMI);
    if (BMI < 18.5 ){
      setState("Underweight");
    }else if(BMI > 18.5 && BMI < 24.9 ){
      setState("Healthy");
    }else if(BMI > 24.9 && BMI < 29.9 ){
      setState("Overweight");
    }else if(BMI > 30){
      setState("Obese");
    }
    return BMI;
  }

  return(
    <SafeAreaView style={styles.container}>
      <Text style={styles.tbar}>BMI Calculator</Text>

        {Platform.OS === "web" ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
          <Text style={styles.tbar}>
            Expo SQlite is not supported on web!
          </Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.content}>
          <TextInput
            style={styles.input}
            onChangeText={(weight) => setWeight(weight)}
            value={weight}
            placeholder="Weight in Pounds"
          />
          <TextInput
            style={styles.input}
            onChangeText={(height) => setHeight(height)}
            value={height}
            placeholder="Height in Inches"
          />
          <TouchableOpacity onPress={()=> add()} style={styles.button}>
            <Text style={styles.btntext}>Compute BMI</Text>
          </TouchableOpacity>
          <Text style={styles.result}>{bmi ? 'Body Mass Index is ' + bmi : ''}</Text>
          <Text style={styles.preview}>{bmi ? '(' + state + ')' : ''}</Text>
          <Items></Items>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  )

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
    width: 'auto',
  },
  tbar:  {
    backgroundColor:  '#f4511e',
    color:  '#fff',
    textAlign:  'center',
    padding:  25,
    fontSize:  28,
    fontWeight:  'bold',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  input: {
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    fontSize: 24,
    height: 40,
    margin: 10,
  },
  button:{
    height: 40,
    alignItems: "center",
    backgroundColor:'#34495e',
    fontSize: 24,
    borderRadius: 3,
    margin: 10,
    padding: 3,
  },
  btntext: {
    color: '#fff',
    fontSize: 24,
  },
  result: {
    color: '#000',
    fontSize: 28,
    marginTop: 20,
    textAlign: 'center'
  },
  preview: {
    backgroundColor: '#fff',
    fontSize: 28,
    textAlign: 'center',
    paddingBottom: 20,
  },
  preview1: {
    backgroundColor: '#fff',
    fontSize: 18,
  },
  
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 22,
    marginBottom: 8,
  },
  
});