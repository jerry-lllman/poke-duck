import { useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Button, Flex, Form, Input, Modal } from "antd";
import { useSetState } from "ahooks";
import ProjectInfo, { IProjectInfo } from "./ProjectInfo";
import { nanoid } from "nanoid";
import ProjectList from "./ProjectList";



function getLocalProjectList() {
  return JSON.parse(localStorage.getItem('project_list') || '[]')
}

function App() {

  const [projectList, setProjectList] = useSetState<IProjectInfo[]>(getLocalProjectList())
  const [visible, setVisible] = useState(false)

  const openAddProjectModal = () => {
    setVisible(true)
  }

  const addProject = (values: IProjectInfo) => {
    const projectInfo = {
      ...values,
      id: nanoid()
    }

    projectList.push(projectInfo)
    setProjectList(projectList)
    // localStorage.setItem('project_list', JSON.stringify(projectList))
    invoke('add_project', { projectInfo })
  }

  return (
    <div>
      <Flex className="mb-5" justify="flex-end">
        <Button onClick={openAddProjectModal}>添加项目</Button>
      </Flex>
      <ProjectInfo open={visible} onOk={addProject} onCancel={() => setVisible(false)} />
      <ProjectList dataSource={projectList} />
    </div>
  );
}

export default App;
