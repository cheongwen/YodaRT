'use strict'

var test = require('tape')
var path = require('path')
var EventEmitter = require('events')

var Descriptors = require('/usr/lib/yoda/runtime/lib/app/activity-descriptor')
var extApp = require('/usr/lib/yoda/runtime/lib/app/ext-app')

var ActivityDescriptor = Descriptors.ActivityDescriptor
var MultimediaDescriptor = Descriptors.MultimediaDescriptor

test('should listen events', t => {
  var target = path.join(__dirname, '..', 'fixture', 'simple-app')

  var runtime = new EventEmitter()
  extApp(target, '@test', runtime)
    .then(descriptor => {
      var activityEvents = Object.keys(ActivityDescriptor.prototype).filter(key => {
        var desc = ActivityDescriptor.prototype[key]
        return desc.type === 'event'
      })
      var multimediaEvents = Object.keys(MultimediaDescriptor.prototype).filter(key => {
        var desc = MultimediaDescriptor.prototype[key]
        return desc.type === 'event'
      })

      activityEvents.forEach(it => {
        t.assert(descriptor.listeners(it).length > 0, `event '${it}' should have been listened.`)
      })
      multimediaEvents.forEach(it => {
        t.assert(descriptor.media.listeners(it).length > 0, `media event '${it}' should have been listened.`)
      })

      descriptor.destruct()
      t.end()
    }, err => {
      t.error(err)
      t.end()
    })
})

test('should trigger events and pass arguments', t => {
  t.plan(2)
  var target = path.join(__dirname, '..', 'fixture', 'ext-app')

  var nlp = { foo: 'bar' }
  var action = { appId: '@test' }
  var runtime = new EventEmitter()
  extApp(target, '@test', runtime)
    .then(descriptor => {
      descriptor.emit('onrequest', nlp, action)
      descriptor.childProcess.on('message', message => {
        if (message.type !== 'test') {
          return
        }
        t.strictEqual(message.event, 'onrequest')
        t.deepEqual(message.args, [ nlp, action ])

        descriptor.destruct()
      })
    })
})

test('should invoke methods and callback', t => {
  t.plan(3)
  var target = path.join(__dirname, '..', 'fixture', 'ext-app')

  var expectedData = { foo: 'bar' }
  var runtime = {
    setPickup: function setPickup (arg1, arg2) {
      t.strictEqual(arg1, 'foo')
      t.strictEqual(arg2, 'bar')
      return Promise.resolve(expectedData)
    }
  }
  extApp(target, '@test', runtime)
    .then(descriptor => {
      descriptor.emit('created')
      descriptor.childProcess.on('message', message => {
        if (message.type !== 'test') {
          return
        }
        var data = message.data
        t.deepEqual(data, expectedData)
        descriptor.destruct()
      })
    })
})