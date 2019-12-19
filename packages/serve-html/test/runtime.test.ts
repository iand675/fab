import { expect } from 'chai'
import { FabFilesObject, FabRequestContext, FabSettings, ProtoFab } from '@fab/core'
import { build } from '../src/build'
import { runtime } from '../src/runtime'
import { ServeHtmlArgs, ServeHtmlMetadata } from '../src/types'
import { Request, Response } from 'node-fetch'

// @ts-ignore
global.Request = Request
// @ts-ignore
global.Response = Response

async function doBuild(files: FabFilesObject, args: ServeHtmlArgs) {
  const proto_fab = new ProtoFab<ServeHtmlMetadata>(files)
  await build(args, proto_fab)
  return proto_fab
}

function request(path: string, settings: FabSettings): FabRequestContext {
  return {
    // @ts-ignore todo: figure out how to make node-fetch work here.
    request: new Request(path),
    url: new URL(`https://example.com${path}`),
    settings,
  }
}

describe('Runtime', () => {
  it('should be a function', () => {
    expect(runtime).to.be.a('function')
  })

  it('should inject settings', async () => {
    const args = {}
    const files = {
      '/index.html': `<html><head><title>HTML Test</title></head><body>here</body></html>`,
    }
    const proto_fab = await doBuild(files, args)

    const renderer = runtime(args, proto_fab.metadata)
    const response = await renderer(request('/', { SOME_VAR: 'some value' }))
    expect(await response?.text()).to.equal(
      '<html><head><script>window.FAB_SETTINGS={"SOME_VAR":"some value"};</script><title>HTML Test</title></head><body>here</body></html>'
    )

    const reponse2 = await renderer(request('/', { MULTIPLE: 'vars', ARE: 'ok too' }))
    expect(await reponse2?.text()).to.equal(
      '<html><head><script>window.FAB_SETTINGS={"MULTIPLE":"vars","ARE":"ok too"};</script><title>HTML Test</title></head><body>here</body></html>'
    )
  })
})
