# p2q
[![npm](https://img.shields.io/badge/npm-p2q-brightgreen.svg?style=flat-square)](https://www.npmjs.com/package/p2q)
[![npm version](https://img.shields.io/npm/v/p2q.svg?style=flat-square)](https://www.npmjs.com/package/p2q)
[![npm downloads](https://img.shields.io/npm/dm/p2q.svg?style=flat-square)](https://www.npmjs.com/package/p2q)
[![sponsors](https://img.shields.io/github/sponsors/diragb)](https://github.com/sponsors/diragb)

Lightweight state management library for Next, React, Solid, etc.

- Share data between components
- Maintain shared state and listen for live updates

# Installation
```bash
yarn add p2q
```

# Usage
## `p2q.ts`

Initialize P2Q with the default state.
```tsx
import P2Q from 'p2q'

export const p2q = new P2Q({
  user: {
    isAuthenticated: false,
    username: '',
  },
  form: {
    emailAddress: '',
    city: '',
  }
})
```

## `UserProfile.tsx`

Add an event listener for the `user` topic.
```tsx
import { useState } from 'react'
import p2q from '@/p2q'

const UserProfile = () => {
  const [userState, setUserState] = useState(p2q.getTopic('user'))

  // State updated by other components.
  const onStateUpdate = (newUserState) => {
    console.log('userState has been updated!', newUserState)
    setUserState(newUserState)
  }

  useEffect(() => {
    p2q.addListenerToTopic('user', onStateUpdate)

    return () => {
      p2q.removeListenerFromTopic('user', onStateUpdate)
    }
  }, [])
}
```

## `LoginButton.tsx`

Toggle `isAuthenticated` on button click.
```tsx
import p2q from '@/p2q'

const LoginButton = () => {
  const toggleAuthenticated = (userState) => {
    return {
      ...userState,
      isAuthenticated: !userState.isAuthenticated,
    }
  }

  const onButtonClick = () => {
    p2q.updateTopic('ID', toggleAuthenticated)
  }
}
```

# API

## addListenerToStore
`(callback: Callback, options: Options) => void`

Adds an event listener to the store, watches for global state updates.

### options
`silentErrors?: boolean` - Does not throw errors, and only exist quietly in case an exception arises.

## removeListenerFromStore
`(callback: Callback, options: Options) => void`

Removes an event listener from the store.

### options
`silentErrors?: boolean` - Does not throw errors, and only exist quietly in case an exception arises.

## addListenerToTopic
`(ID: string, callback: Callback, options?: Options) => void`

Adds an event listener to a topic, by passing its ID, an watches for updates to the topic.

### options
`silentErrors?: boolean` - Does not throw errors, and only exist quietly in case an exception arises.

`ensure?: boolean` - If the topic does not exist, then it creates it and initializes it with an empty object.

## removeListenerFromTopic
`(ID: string, callback: Callback, options?: Options) => void`

Removes an event listener from a topic.

### options
`silentErrors?: boolean` - Does not throw errors, and only exist quietly in case an exception arises.

## getStore
`(topicID?: string, options?: Options) => Store | Topic`

Fetches the latest state of the global store, or a particular topic (if `topicID` is passed).

### options
`silentErrors?: boolean` - Does not throw errors, and only exist quietly in case an exception arises.

## getTopic
`(topicID: string, options?: Options) => Topic`

Fetches the latest state of a topic.

### options
`silentErrors?: boolean` - Does not throw errors, and only exist quietly in case an exception arises.

## createTopic
`(ID: string, initialTopic?: Object, options?: Options) => Topic`

Creates a new topic with the `ID` and initializes it with `initialTopic`, if passed.

### options
`silentErrors?: boolean` - Does not throw errors, and only exist quietly in case an exception arises.

`overwrite?: boolean` - If the topic already exists, then it overwrites it with the `initialTopic`.

## updateTopic
`(ID: string, mutator: Callback, options: Options) => Topic`

Updates a topic with the `ID` (if present), by running the `mutator` function passed to it.

### options
`silentErrors?: boolean` - Does not throw errors, and only exist quietly in case an exception arises.

`ensure: boolean` - If the topic that is being updated does not exist, then it creates it and initializes it with an empty object.

## deleteTopic
`(ID: string, options?: Options) => Topic`

Deletes a topic with the `ID`. Throws an error if the topic does not exist. On deletion, sends `undefined` to all the attached event listeners.

### options
`silentErrors?: boolean` - Does not throw errors, and only exist quietly in case an exception arises.

## resetTopic
`(ID: string, options?: Options) => Topic`

Resets a topic with the `ID` to its default state. Throws an error if the topic does not exist.

### options
`silentErrors?: boolean` - Does not throw errors, and only exist quietly in case an exception arises.

`ensure?: boolean` - If the topic that is being reset does not have a default state, then it creates it and initializes it with an empty object.

`overrideDefaultTopicWith?: Object` - Resets the topic to this state, does not matter if the default state exists or not.

# Philosophy
`p2q` has a concept of **topics**, which are essentially an objects inside the **store** object. The language type of **topic** must always be an `Object` (e.g. arrays, functions, objects, regexes, new Number(0), and new String('')).

## License
MIT