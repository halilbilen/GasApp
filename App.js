import React, { Component } from 'react'
import { View, Text, PermissionsAndroid } from 'react-native'
import { BleManager } from 'react-native-ble-plx';


export default class App extends Component {
  constructor() {
    super();
    this.manager = new BleManager();
  }
  componentDidMount() {
    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permission Localisation Bluetooth',
        message: 'Requirement for Bluetooth',
        buttonNeutral: 'Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    const subscription = this.manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        this.scanAndConnect();
        subscription.remove();
      }
    }, true);
  }

  scanAndConnect() {
    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error)
        return
      }
      console.log(device.name)

      if (device.id !=null && device.name!="Mi Smart Band 4") {
        this.manager.stopDeviceScan()
        device.connect()
          .then((device) => {
            console.log("Discovering services and characteristics")
            return device.discoverAllServicesAndCharacteristics()
          })
          .then((device) => {
            console.log("Setting notifications")
            return this.setupNotifications.bind(this,device)
          })
          .then(() => {

            // this.getNotifyServicesAndCharacteristics(device)
          }, (error) => {
            console.log(error.message)
          })

      } else {
        console.log("Deneme2")
        this.manager.stopDeviceScan();
      }
    });
  }

  getNotifyServicesAndCharacteristics(device) {
    return new Promise((resolve, reject) => {
      device.services().then(services => {
        const characteristics = []

        services.forEach((service, i) => {
          service.characteristics().then(c => {
            characteristics.push(c)

            if (i === services.length - 1) {
              const temp = characteristics.reduce((acc, current) => {
                return [...acc, ...current]
              }, [])
              const dialog = temp.find(
                characteristic => characteristic.isNotifiable
              )
              if (!dialog) {
                reject('No notifiable characteristic')
              }
              resolve(dialog)
            }
          })
        })
      })
    })
  }

  async setupNotifications(device) {
    for (const id in this.sensors) {
      const service = this.serviceUUID(id)
      const characteristicW = this.writeUUID(id)
      const characteristicN = this.notifyUUID(id)

      const characteristic = await device.writeCharacteristicWithResponseForService(
        service, characteristicW, "AQ==" /* 0x01 in hex */
      )

      device.monitorCharacteristicForService(service, characteristicN, (error, characteristic) => {
        if (error) {
          this.error(error.message)
          return
        }
        this.updateValue(characteristic.uuid, characteristic.value)
      })
    }
  }

  render() {
    return (
      <View>
        <Text>Deneme</Text>
      </View>
    )
  }
}
