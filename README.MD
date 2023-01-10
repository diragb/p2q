# p2q
[![npm](https://img.shields.io/badge/npm-p2q-brightgreen.svg?style=flat-square)](https://www.npmjs.com/package/p2q)
[![npm version](https://img.shields.io/npm/v/p2q.svg?style=flat-square)](https://www.npmjs.com/package/p2q)
[![npm downloads](https://img.shields.io/npm/dm/p2q.svg?style=flat-square)](https://www.npmjs.com/package/p2q)
[![sponsors](https://img.shields.io/github/sponsors/diragb)](https://github.com/sponsors/diragb)

Lightweight, cross-component data sharing for React, Solid, etc.

# Installation
```bash
npm i p2q
```

# Usage
## React
In `ComponentA.jsx`
```jsx
import p2q from 'p2q'

const ComponentA = (props) => {
  const A = p2q.register('Component-A')

  useEffect(() => {
    A.listen((from, data) => {
      // This will print "Component-B  Message for Component A"
      console.log(from, data)
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

  useEffect(() => {
    B.tell('Component-A', 'Message for Component A')
    // Or..
    B.broadcast('This message will be broadcasted to all registered components')

    return () => {
      B.unsubscribe()
    }
  })
}
```

## Solid
```jsx
const ComponentA = (props) => {
  const A = p2q.register('Component-A')

  onMount(() => {
    A.listen((from, data) => {
      // This will print "Component-B  Message for Component A"
      console.log(from, data)
    })
  })

  onCleanup(() => {
    A.unsubscribe()
  })
}
```

In `ComponentB.jsx`
```jsx
const ComponentB = (props) => {
  const B = p2q.register('Component-B')

  onMount(() => {
    B.tell('Component-A', 'Message for Component A')
    // Or..
    B.broadcast('This message will be broadcasted to all registered components')
  })

  onCleanup(() => {
    A.unsubscribe()
  })
}
```

# [Why](https://i.kym-cdn.com/photos/images/original/002/414/481/df9.jpg)

# Notes
I do not recommend the usage of this package for big applications, because Redux works best for state-management at that point. But if you're building a small application and don't really care enough, or Redux seems like overkill but you really need X-Component data sharing, then you can give this a try. Indian developers can refer to [this handy infographic](https://i.redd.it/9513a9lrod371.jpg).

## License
MIT