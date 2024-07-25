import { useMemo, useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Button, Flex, Popconfirm, Space } from "antd";
import { useMount, useSetState } from "ahooks";
import ProjectInfo, { IProjectInfo } from "./ProjectInfo";
import { nanoid } from "nanoid";
import ProjectList from "./ProjectList";


interface IProjectData {
  total: number;
  current: number;
  pageSize: number;
  data: Required<IProjectInfo>[];

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
      id: nanoid(), // 这个 id 生成可以挪到后端生成
      ...values
    }
    await invoke('add_project', { projectInfo })
    onCancel()
    getProjectData()
  }

  const updateProject = async (values: IProjectInfo) => {
    // TODO 优化
    if (disabled) return
    await invoke('update_project', { projectInfo: { ...values, id: currentProjectId } })
    onCancel()
    getProjectData()
  }

  const onCancel = () => {
    setCurrentProjectId(undefined)
    setVisible(false)
  }

  const clearData = async () => {
    await invoke('clear_data')
    getProjectData()
  }

  // TODO: currentProjectId disabled visible 三个状态可以合并成一个状态
  const [currentProjectId, setCurrentProjectId] = useState<string>()
  const [disabled, setDisabled] = useState(false)

  const viewProject = (id: string) => {
    setCurrentProjectId(id)
    setVisible(true)
    setDisabled(true)
  }

  const editProject = (id: string) => {
    setCurrentProjectId(id)
    setVisible(true)
  }

  const currentProject = useMemo(() => {
    return projectData.data.find(item => item.id === currentProjectId)
  }, [currentProjectId, projectData.data])

  return (
    <div className="m-2">
      <Flex className="mb-5" justify="flex-end">
        <Space>
          <Button onClick={openAddProjectModal}>添加项目</Button>
          <Popconfirm title="清除所有数据" onConfirm={clearData}>
            <Button danger>清除数据</Button>
          </Popconfirm>
        </Space>
      </Flex>
      {/* 单独路由页面 */}
      <ProjectInfo
        initialValues={currentProject}
        open={visible}
        disabled={disabled}
        onOk={currentProjectId ? updateProject : addProject}
        onCancel={onCancel}
      />
      <ProjectList
        dataSource={projectData.data}
        getDataSource={getProjectData}
        viewProject={viewProject}
        editProject={editProject}
      />
    </div>
  );
}

export default App;
