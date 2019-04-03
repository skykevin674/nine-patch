<h1 align="center">ngNinePatch</h1>

An angular control of <a href="https://developer.android.com/studio/write/draw9patch">Nine Patch</a>

## Getting Started


Add needed package to NgModule imports:
```
import { NgNinePatchModule } from 'ng-nine-patch';

@NgModule({
  ...
  imports: [NgNinePatchModule,...]
  ...
})
```

Add component to your page:
```
<div libNinePatch src="assets/border.9.png"></div>
```
## Options
`ninePatch` directive support following input porperties:

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `[src]` | string | null | .9 image path |
| `[repeatMode]` | string | scale | the image repeat mode, use 'scale' or repeat |


### License

MIT