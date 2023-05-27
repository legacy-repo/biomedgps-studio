import { useEffect, useRef } from 'react';
import { Popover } from 'antd';
import Moveable from 'react-moveable';
import { CloseOutlined, QuestionCircleFilled } from '@ant-design/icons';
import './Movable.less';

type MovableProps = {
  onClose?: () => void
  width?: string,
  title?: string,
  top?: string,
  right?: string,
  help?: string | JSX.Element,
}

const Movable: React.FC<MovableProps> = (props) => {
  const explanationPanelRef = useRef<HTMLDivElement>(null);
  const movableComponentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (movableComponentRef.current) {
      const component = movableComponentRef.current;
      component.addEventListener('click', () => {
        console.log("Focus the explanation panel");
        component.style.zIndex = '10';

        const otherComponents = document.getElementsByClassName('explanation-panel');
        for (let i = 0; i < otherComponents.length; i++) {
          const otherComponent = otherComponents[i] as HTMLDivElement;
          if (otherComponent !== component) {
            otherComponent.style.zIndex = '2';
          }
        }
      });
    }
  }, [movableComponentRef.current]);

  return <div className='explanation-panel' ref={movableComponentRef}
    style={{
      top: props.top || '200px',
      right: props.right || (props.width || "400px"),
    }}>
    <div ref={explanationPanelRef} style={{
      position: "absolute",
      width: props.width || "400px",
      maxWidth: "auto",
      maxHeight: "auto",
    }} className="explanation-content">
      <div className="explanation-title">
        <h3>{props.title || 'Explanation'}</h3>
        {
          props.help ?
            <Popover content={props.help} title="Help" placement='topRight'>
              <QuestionCircleFilled />
            </Popover>
            : null
        }
        {
          props.onClose ?
            <CloseOutlined className="explanation-close" onClick={() => {
              props.onClose?.();
            }} />
            : null
        }
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