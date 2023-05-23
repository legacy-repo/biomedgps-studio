import { useRef } from 'react';
import Moveable from 'react-moveable';
import { CloseOutlined } from '@ant-design/icons';
import './Movable.less';

type MovableProps = {
  onClose?: () => void
  width?: string,
  title?: string,
}

const Movable: React.FC<MovableProps> = (props) => {
  const explanationPanelRef = useRef<HTMLDivElement>(null);

  return <div className='explanation-panel'
    style={{
      top: '200px',
      right: props.width || "400px",
    }}>
    <div ref={explanationPanelRef} style={{
      position: "absolute",
      width: props.width || "400px",
      maxWidth: "auto",
      maxHeight: "auto",
    }} className="explanation-content">
      <div className="explanation-title">
        <h3>{props.title || 'Explanation'}</h3>
        <CloseOutlined className="explanation-close" onClick={() => {
          props.onClose?.();
        }} />
      </div>
      <div className='explanation-info'>
        {props.children}
      </div>
    </div>
    {/* More details on https://daybrush.com/moveable/storybook/index.html?path=/story/basic--basic-resizable */}
    <Moveable
      target={explanationPanelRef}
      draggable={true}
      throttleDrag={1}
      edgeDraggable={false}
      startDragRotate={0}
      throttleDragRotate={0}
      onDrag={e => {
        e.target.style.transform = e.transform;
      }}
      resizable={true}
      keepRatio={false}
      throttleResize={1}
      renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
      onResize={e => {
        e.target.style.width = `${e.width}px`;
        e.target.style.height = `${e.height}px`;
        e.target.style.transform = e.drag.transform;
      }}
    />
  </div>
};

export default Movable;