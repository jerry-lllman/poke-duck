import { useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Button, Flex } from "antd";
import { useMount, useSetState } from "ahooks";
import ProjectInfo, { IProjectInfo } from "./ProjectInfo";
import { nanoid } from "nanoid";
import ProjectList from "./ProjectList";


interface IProjectData {
  total: number;
  current: number;
  pageSize: number;
  data: IProjectInfo[];

}

function App() {

  const [visible, setVisible] = useState(false)
  const openAddProjectModal = () => {
    setVisible(true)
  }

  const [projectData, setProjectData] = useSetState<IProjectData>({
    total: 0,
    current: 0,
    pageSize: 0,
    data: []
  })

  const getProjectData = async () => {
    try {
      const res = await invoke<IProjectData>('get_projects')
      setProjectData(res)
    } catch (error) { }
  }

  useMount(() => {
    getProjectData()
  })

  const addProject = async (values: IProjectInfo) => {
    const projectInfo = {
      ...values,
      id: nanoid()
    }
    await invoke('add_project', { projectInfo })
    setVisible(false)
    getProjectData()
  }

  const clearData = async () => {
    await invoke('clear_data')
    getProjectData()
  }

  return (
    <div>
      <Flex className="mb-5" justify="flex-end">
        <Button onClick={openAddProjectModal}>添加项目</Button>
        <Button onClick={clearData} >清除数据</Button>
      </Flex>
      <ProjectInfo open={visible} onOk={addProject} onCancel={() => setVisible(false)} />
      <ProjectList
        dataSource={projectData.data}
        getDataSource={getProjectData}
      />
    </div>
  );
}

export default App;
