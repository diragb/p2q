# p2q
[![npm](https://img.shields.io/badge/npm-p2q-brightgreen.svg?style=flat-square)](https://www.npmjs.com/package/p2q)
[![npm version](https://img.shields.io/npm/v/p2q.svg?style=flat-square)](https://www.npmjs.com/package/p2q)
[![npm downloads](https://img.shields.io/npm/dm/p2q.svg?style=flat-square)](https://www.npmjs.com/package/p2q)
[![sponsors](https://img.shields.io/github/sponsors/diragb)](https://github.com/sponsors/diragb)

Lightweight state management, local persistence, and synchronization library for Next, React, Solid, etc.

- Share state between components and various contexts.
- Maintain shared state and listen for live updates.
- Persist the state locally.

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
import { useState, useEffect } from 'react'
import p2q from '@/p2q'

const UserProfile = () => {
  const [userState, setUserState] = useState(p2q.topic.get('user'))

  // State updated by other components.
  const onStateUpdate = (newUserState) => {
    console.log('userState has been updated!', newUserState)
    setUserState(newUserState)
  }

  useEffect(() => {
    p2q.topic.addListener('user', onStateUpdate)

    return () => {
      p2q.topic.removeListener('user', onStateUpdate)
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
    p2q.topic.update('ID', toggleAuthenticated)
  }
}
```

# Philosophy
`p2q` has a concept of **topics**, which are essentially an objects inside the **store** object. The language type of **topic** must always be an `Object` (e.g. arrays, functions, objects, regexes, new Number(0), and new String('')).

# API

## P2Q
`const p2q = new P2Q(initialState?: any, options?: P2QOptions)`

Create a new p2q instance with an optional initial state.

### P2QOptions
`persistLocally?: boolean` - Persist the state locally by using asynchronous storage (IndexedDB or WebSQL).

`crossOriginCommunication?: CrossOriginCommunication` - Sets up cross-origin communication mode. All updates to the state are broadcasted using `window.parent.postMessage` and any changes from the outer context are intercepted using `window.parent.addEventListener('message', ...)`. Useful for communication between P2Q clients between different contexts (across tabs, iframes, and so on).

#### CrossOriginCommunication
- `id: string` - Unique ID for the P2Q client, this will help your other P2Q client identify what messages to intercept.
- `enabled: boolean` - Cross Origin Communication will only work if this is enabled.
- `targetOrigin: string | undefined` - The origin to post messages to. Defaults to `*`.
- `acceptableIDs: Set<string>` - The set of valid IDs of P2Q clients in outer contexts. P2Q will only parse the messages of clients that have IDs in this set.

## store

### get
`(topicID?: string, options?: Options) => Store | Topic`

Fetches the latest state of the global store, or a particular topic (if `topicID` is passed).

#### options
`silentErrors?: boolean` - Does not throw errors, and only exist quietly in case an exception arises.

### addListener
`(callback: Callback, options: Options) => void`

Adds an event listener to the store, watches for global state updates.

#### options
- `silentErrors?: boolean`

### removeListener
`(callback: Callback, options: Options) => void`

Removes an event listener from the store.

#### options
- `silentErrors?: boolean`

## topic

### get
`(topicID: string, options?: Options) => Topic`

Fetches the latest state of a topic.

#### options
- `silentErrors?: boolean`

### create
`(ID: string, initialTopic?: Object, options?: Options) => Topic`

Creates a new topic with the `ID` and initializes it with `initialTopic`, if passed.

#### options
- `silentErrors?: boolean`

- `overwrite?: boolean` - If the topic already exists, then it overwrites it with the `initialTopic`.

### update
`(ID: string, mutator: Callback, options: Options) => Topic`

Updates a topic with the `ID` (if present), by running the `mutator` function passed to it.

#### options
- `silentErrors?: boolean`

- `ensure: boolean` - If the topic that is being updated does not exist, then it creates it and initializes it with an empty object.

### delete
`(ID: string, options?: Options) => Topic`

Deletes a topic with the `ID`. Throws an error if the topic does not exist. On deletion, sends `undefined` to all the attached event listeners.

#### options
- `silentErrors?: boolean`

### reset
`(ID: string, options?: Options) => Topic`

Resets a topic with the `ID` to its default state. Throws an error if the topic does not exist.

#### options
- `silentErrors?: boolean`

- `ensure?: boolean` - If the topic that is being reset does not have a default state, then it creates it and initializes it with an empty object.

- `overrideDefaultTopicWith?: Object` - Resets the topic to this state, does not matter if the default state exists or not.

### addListener
`(ID: string, callback: Callback, options?: Options) => void`

Adds an event listener to a topic, by passing its ID, an watches for updates to the topic.

#### options
- `silentErrors?: boolean`

- `ensure?: boolean` - If the topic does not exist, then it creates it and initializes it with an empty object.

### removeListener
`(ID: string, callback: Callback, options?: Options) => void`

Removes an event listener from a topic.

#### options
- `silentErrors?: boolean`

## crossOrigin

### `id`

#### get
`() => string`

Fetches the current ID of the P2Q client.

#### set
`(ID: string, options?: Options) => string | undefined`

Sets the ID of the P2Q client.

##### options
- `silentErrors?: boolean`

### `enable`
`() => void`

Enables Cross Origin Communication.

### `disable`
`() => void`

Disables Cross Origin Communication.

### `targetOrigin`

#### get
`() => string`

Fetches the current `targetOrigin` of the P2Q client.

#### set
`(targetOrigin: string, options?: Options) => string | undefined`

Sets the `targetOrigin` of the P2Q client.

##### options
- `silentErrors?: boolean`

### `acceptableIDs`

#### get
`() => string`

Fetches the set of acceptable P2Q IDs whose messages will be read.

#### set
`(mutator: (acceptableIDs: Set<string>) => Set<string>, options?: Options) => string`

Sets acceptable P2Q IDs, pass a callback/mutator to the `set` function.

##### options
- `silentErrors?: boolean`

#### add
`(ID: string, options?: Options) => string`

Adds a new ID to the set of acceptable P2Q IDs.

##### options
- `silentErrors?: boolean`

#### delete
`(ID: string, options?: Options) => string`

Deletes an ID from the set of acceptable P2Q IDs.

##### options
- `silentErrors?: boolean`

### `removeListener`
`() => void`

Removes the event listener for Cross Origin Communication. **Once removed, it cannot be attached back.**

## License
MIT