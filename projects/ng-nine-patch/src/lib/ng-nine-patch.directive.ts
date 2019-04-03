import { Directive, Input, OnInit, ElementRef, Renderer2, OnChanges, SimpleChanges } from '@angular/core';
import { fromEvent, of } from 'rxjs';

@Directive({
  selector: '[libNinePatch]'
})
export class NinePatchDirective implements OnInit, OnChanges {
  @Input() src: string;

  @Input() repeatMode: 'repeat' | 'scale';

  private originCanvas: any;
  private originContext: any;

  // .9四边的标记数据
  private markData: any;

  private bgCanvas: any;
  private bgContext: any;
  private padding = [];

  constructor(private elem: ElementRef, private renderer: Renderer2) { }

  ngOnInit() {
    this.renderer.setStyle(this.elem.nativeElement, 'box-sizing', 'border-box');
  }

  private clear() {
    this.originCanvas = null;
    this.originContext = null;
    this.markData = null;
    this.bgCanvas = null;
    this.bgContext = null;
    this.renderer.removeStyle(this.elem.nativeElement, 'background');
    this.renderer.removeStyle(this.elem.nativeElement, 'padding');
  }

  ngOnChanges(change: SimpleChanges) {
    setTimeout(() => {
      if (change.src) {
        if (change.src.currentValue) {
          this.patch();
        } else {
          this.clear();
        }
      }
    });

  }

  resize() {
    if (!this.markData) {
      return;
    }
    const pts = this.src.split('.').reverse();
    if (pts[0] === 'png' && pts[1] === '9') {
      // 是否进行缩放
      const scale = 1;

      // 获取内容区域两侧端点
      const horiPadding = this.getPaddingEndPoints(this.markData.contentHorizontal, this.markData.repeatHorizontal);
      const vertPadding = this.getPaddingEndPoints(this.markData.contentVertical, this.markData.repeatVertical);
      this.padding = [(vertPadding[0] - 1) * scale, (this.originCanvas.width - horiPadding[1] - 1) * scale,
      (this.originCanvas.height - vertPadding[1] - 1) * scale, (horiPadding[0] - 1) * scale];
      this.renderer.setStyle(this.elem.nativeElement, 'padding',
        this.padding.map(p => p + 'px').join(' '));

      // 绘制图片
      const selfWidth = this.elem.nativeElement.clientWidth;
      const selfHeight = this.elem.nativeElement.clientHeight;
      if (!selfWidth || !selfHeight) {
        return;
      }
      // 不伸缩尺寸
      const staticWidth = this.calcStaticWidth(this.markData.repeatHorizontal);
      const staticHeight = this.calcStaticWidth(this.markData.repeatVertical);
      // 伸缩尺寸
      const repeatWidth = this.originCanvas.width - staticWidth - 2;
      const repeatHeight = this.originCanvas.height - staticHeight - 2;
      // 当前大小下需要伸缩的像素
      const remainWidth = selfWidth - Math.floor(staticWidth * scale);
      const remainHeight = selfHeight - Math.floor(staticHeight * scale);

      const widthFactor = remainWidth / repeatWidth;
      const heightFactor = remainHeight / repeatHeight;

      this.bgCanvas = document.createElement('canvas');
      this.bgCanvas.width = selfWidth;
      this.bgCanvas.height = selfHeight;
      this.bgContext = this.bgCanvas.getContext('2d');

      // 当前绘制坐标
      let pointX = 0, pointY = 0;
      this.markData.repeatHorizontal.forEach((hori) => {
        pointY = 0;
        const originWidth = hori.end - hori.start;
        this.markData.repeatVertical.forEach((vert) => {
          const originHeight = vert.end - vert.start;
          if (hori.repeat) {
            if (vert.repeat) {
              // 整体伸缩
              this.drawPiece(this.bgContext, scale, widthFactor, heightFactor, this.originCanvas,
                hori.start, vert.start, originWidth, originHeight, pointX, pointY);
              pointY += originHeight * heightFactor;
            } else {
              // 横向伸缩
              this.drawPiece(this.bgContext, scale, widthFactor, 0, this.originCanvas, hori.start, vert.start, originWidth, originHeight,
                pointX, pointY);
              pointY += Math.floor(originHeight * scale);
            }
          } else {
            if (vert.repeat) {
              // 纵向伸缩
              this.drawPiece(this.bgContext, scale, 0, heightFactor, this.originCanvas, hori.start, vert.start, originWidth, originHeight,
                pointX, pointY);
              pointY += originHeight * heightFactor;
            } else {
              // 静态
              this.drawPiece(this.bgContext, scale, 0, 0, this.originCanvas, hori.start, vert.start, originWidth, originHeight,
                pointX, pointY);
              pointY += Math.floor(originHeight * scale);
            }
          }
        });
        if (hori.repeat) {
          pointX += originWidth * widthFactor;
        } else {
          pointX += Math.floor(originWidth * scale);
        }
      });
      this.renderer.setStyle(this.elem.nativeElement, 'background',
        `url(${this.bgCanvas.toDataURL()}) no-repeat 0 0/cover`);
    }
  }

  private patch() {
    const pts = this.src.split('.').reverse();
    if (pts[0] === 'png' && pts[1] === '9') {
      const img = new Image();
      img.src = this.src;
      fromEvent(img, 'load').subscribe(() => {
        this.originCanvas = document.createElement('canvas');
        this.originCanvas.width = img.width;
        this.originCanvas.height = img.height;
        this.originContext = this.originCanvas.getContext('2d');
        this.originContext.drawImage(img, 0, 0);
        // 第一行数据
        const repeatHorizontal = this.getRepeatPieces(this.originContext.getImageData(0, 0, this.originCanvas.width, 1).data);
        const repeatVertical = this.getRepeatPieces(this.originContext.getImageData(0, 0, 1, this.originCanvas.height).data);
        const contentHorizontal = this.getRepeatPieces(this.originContext.getImageData(0, this.originCanvas.height - 1, this.originCanvas.width, 1).data);
        const contentVertical = this.getRepeatPieces(this.originContext.getImageData(this.originCanvas.width - 1, 0, 1, this.originCanvas.height).data);
        this.markData = {
          repeatHorizontal, repeatVertical, contentHorizontal, contentVertical
        };
        // 针对非法的.9图片处理
        if (repeatHorizontal.some(r => r.repeat) && repeatVertical.some(r => r.repeat)) {
          // this.updateColor();
          this.resize();
        } else {
          this.renderer.setStyle(this.elem.nativeElement, 'background',
            `url(${this.src}) no-repeat 0 0/100% 100%`);
        }
      });
    } else {
      this.renderer.setStyle(this.elem.nativeElement, 'background',
        `url(${this.src}) no-repeat 0 0/100% 100%`);
    }
  }

  private drawPiece(context: any, scale: number, widthFactor: number, heightFactor: number, image: any,
    x: number, y: number, w: number, h: number, dx: number, dy: number) {
      if (this.repeatMode === 'repeat') {
        const horiLoop = Math.ceil(widthFactor) || 1;
        const vertLoop = Math.ceil(heightFactor) || 1;
        const totalWidth = Math.floor(w * widthFactor);
        const totalHeight = Math.floor(h * heightFactor);

        for (let i = 0; i < horiLoop; i++) {
          const sw = this.calcTargetSize(w, i, widthFactor, totalWidth);
          for (let j = 0; j < vertLoop; j++) {
            const sh = this.calcTargetSize(h, j, heightFactor, totalHeight);
            context.drawImage(image, x, y, w, h, dx + i * w, dy + j * h, Math.floor(sw * scale) || 1, Math.floor(sh * scale) || 1);
          }
        }
      } else {
        context.drawImage(image, x, y, w, h, dx, dy, Math.floor(w * (widthFactor || 1)), Math.floor(h * (heightFactor || 1)));
      }
  }

  private calcTargetSize(sourceWidth: number, index: number, factor: number, total: number) {
    const tw = (index + 1) * sourceWidth;
    let sw = sourceWidth;
    if (factor) {
      if (tw > total) {
        sw = sourceWidth - (tw - total);
      }
    }
    return sw;
  }

  // 获取不伸缩的图片像素数
  private calcStaticWidth(array: any[]) {
    return array.filter(t => !t.repeat).reduce((p, c) => {
      return p + (c.end - c.start);
    }, 0);
  }

  // 获取内边距端点
  private getPaddingEndPoints(contentArray: any[], repeatArray: any[]) {
    let tempContHori = contentArray.filter(c => !!c.repeat);
    if (!tempContHori.length) {
      tempContHori = repeatArray.filter(r => !!r.repeat);
    }
    return tempContHori.reduce((p, c) => {
      if (p[0] > c.start) {
        p[0] = c.start;
      }
      if (p[1] < c.end) {
        p[1] = c.end;
      }
      return p;
    }, [Number.MAX_SAFE_INTEGER, 0]);
  }

  // 获取扩展部分信息
  private getRepeatPieces(data: number[]) {
    const array = [];
    let position = 1;
    const base = this.getPixelSignature(data.slice(0, 4));
    let currentPixel = base;
    for (let i = 4; i <= data.length - 8; i += 4) {
      const pixelSig = this.getPixelSignature(data.slice(i, i + 4));
      if (pixelSig !== currentPixel) {
        array.push({ start: position, end: i / 4, repeat: currentPixel !== base });
        currentPixel = pixelSig;
        position = i / 4;
      }
    }
    array.push({ start: position, end: (data.length - 4) / 4, repeat: currentPixel !== base });
    return array;
  }

  private getPixelSignature(data: number[]) {
    return data.join(',');
  }
}
