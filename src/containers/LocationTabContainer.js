import React from 'react'
import { useSnackbar } from 'notistack'
import Resizer from 'react-image-file-resizer'
import dataUriToBuffer from 'data-uri-to-buffer'
import api from '../api'
import { useAuth0 } from '../auth0'
import LocationTab from '../components/LocationTab'
import Text from '../components/Text'


const LocationTabContainer = ({
  content,
  selectedLocation,
  setSelectedLocation,
  refreshMap,
  closeLocationTab,
  setLocationTabContent,
  ...otherProps
}) => {
  const { isLoggedIn } = useAuth0()
  const { enqueueSnackbar } = useSnackbar()

  const onSubmitLocation = async (fields, editExisting) => {
    /* eslint-disable camelcase */
    const {
      name,
      description,
      type,
      water_exists,
      water_comment,
      fire_exists,
      fire_comment,
    } = fields
    const [lat, lon] = fields.location.split(', ')

    const data = {
      name,
      description,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      type,
      water_exists: water_exists || false,
      water_comment: water_exists ? water_comment : false,
      fire_exists: fire_exists || false,
      fire_comment: fire_exists ? fire_comment : false,
    }
    console.log('data: ', data)

    try {
      if (editExisting) {
        const { id } = selectedLocation
        const { data: { _id, _source } } = await api.post('modify_point', { id, ...data })
        console.log('response: ', _id, _source)
        setSelectedLocation({ id: _id, ..._source })
        enqueueSnackbar(<Text id='notifications.markerUpdated' />, { variant: 'success' })
      } else {
        const { data: { _id, _source } } = await api.post('add_point', data)
        console.log('response: ', _id, _source)
        setSelectedLocation({ id: _id, ..._source })
        enqueueSnackbar(<Text id='notifications.newMarkerAdded' />, { variant: 'success' })
      }
      setLocationTabContent('markerInfo')
      refreshMap()
    } catch (error) {
      console.error(error)
      enqueueSnackbar(<Text id='notifications.couldNotSaveMarker' />, { variant: 'error' })
    }
  }

  const onImageUpload = async files => {
    try {
      const file = files[0]
      await Resizer.imageFileResizer(
        file,
        1080, // Maximum width
        1080, // Maximum height
        'JPEG', // Format
        80, // Quality 1-100
        0, // Rotation
        async uri => {
          const decoded = dataUriToBuffer(uri)
          const resizedFile = new File([decoded], file.name, { type: file.type })
          const data = new FormData()
          data.append('file', resizedFile)
          const { data: { _id, _source } } = await api.post(`add_image/${selectedLocation.id}`, data)
          console.log('response: ', _id, _source)
          setSelectedLocation({ id: _id, ..._source })
          setLocationTabContent('markerInfo')
          enqueueSnackbar(<Text id='notifications.photoAdded' />, { variant: 'success' })
        },
      )
    } catch (error) {
      console.error(error)
      enqueueSnackbar(<Text id='notifications.couldNotSavePhoto' />, { variant: 'error' })
    }
  }

  return (
    <LocationTab
      loggedIn={isLoggedIn}
      onSubmitLocation={(fields, editExisting) => onSubmitLocation(fields, editExisting)}
      onImageUpload={files => onImageUpload(files)}
      selectedLocation={selectedLocation}
      setSelectedLocation={location => setSelectedLocation(location)}
      content={content}
      setLocationTabContent={content => setLocationTabContent(content)}
      closeLocationTab={closeLocationTab}
      {...otherProps}
    />
  )
}

export default LocationTabContainer
