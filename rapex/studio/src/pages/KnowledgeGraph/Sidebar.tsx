import React from "react";
import Icon, {
    BranchesOutlined
} from "@ant-design/icons";
import './sidebar.less';

const Sidebar: React.FC = () => {
    function SidebarOption({ text, name }) {
        return (
            <div className="sidebar-option">
                <Icon className="icon" component={name} />
                <span className="name">{text}</span>
            </div>
        );
    }

    return (
        <div className="sidebar">
            <SidebarOption text="Layout" name={BranchesOutlined} />
        </div>
    );
}

export default Sidebar;