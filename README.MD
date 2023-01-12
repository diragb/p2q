# p2q
[![npm](https://img.shields.io/badge/npm-p2q-brightgreen.svg?style=flat-square)](https://www.npmjs.com/package/p2q)
[![npm version](https://img.shields.io/npm/v/p2q.svg?style=flat-square)](https://www.npmjs.com/package/p2q)
[![npm downloads](https://img.shields.io/npm/dm/p2q.svg?style=flat-square)](https://www.npmjs.com/package/p2q)
[![sponsors](https://img.shields.io/github/sponsors/diragb)](https://github.com/sponsors/diragb)

Lightweight, cross-component, cross-context data and state sharing for React, Solid, etc.

- Share data between components on the webapp, across tabs and windows
- Maintain shared state and listen for live updates
- Components can query other components for answers

# Installation
```bash
npm i p2q
```

# Usage
## React
In `App.jsx`
```jsx
import p2q from 'p2q'

const store = p2q.createStore({
  hello: ''
})
```

In `ComponentA.jsx`
```jsx
import p2q from 'p2q'

const ComponentA = (props) => {
  const ID = 'Component-A'
  const A = p2q.register(ID)
  const storeSnapshot = p2q.getStore()

  useEffect(() => {
    // Reacts to broadcasts and direct messages to this component
    A.listen((from, data) => {
      console.log(from, data)
    })

    // Sets store across all components
    p2q.setStore({ ...storeSnapshot, hello: 'there' })

    // Sets store across all contexts (webapp, tabs, windows)
    p2q.setStore({ ...storeSnapshot, hello: 'world!' }, { global: true })

    A.setupResponseHandler((respondingTo: ID) => {
      if (ID === 'Component-A') A.tell(respondingTo, true)
      else A.tell(respondingTo, false)
    })

    return () => {
      A.unsubscribe()
    }
  })
}
```

In `ComponentB.jsx`
```jsx
import p2q from 'p2q'

const ComponentB = (props) => {
  const B = p2q.register('Component-B')
  const [ store, setStore ] = useState(p2q.getStore())

  useEffect(() => {
    // Reacts to changes in store
    B.listenToStore(setStore)

    B.tell('Component-A', 'This message will be sent to Component A')
    B.broadcast('This message will be broadcasted to all registered components')
    B.broadcast('This message will be broadcasted to all registered components across all contexts (webapp, tabs, windows)', { global: true })
    
    // Start listening for responses to the question we will ask..
    B.listen((from, data) => {
      if (data === true) console.log('Component A exists!')
    })
    // Ask all components if they are Component A
    B.ask()

    return () => {
      B.unsubscribe()
    }
  })
}
```

# [Why](https://i.kym-cdn.com/photos/images/original/002/414/481/df9.jpg)

# Notes
I do not recommend the usage of this package for big applications, because Redux works best for state-management at that point. But if you're building a small application and don't really care enough, or Redux seems like overkill but you really need X-Component data sharing and state management, then you can give this a try. Indian developers can refer to [this handy infographic](https://i.redd.it/9513a9lrod371.jpg).

## License
MIT