import { AxiosResponse } from 'axios';
import request from '../utils/request';
import { INamespace } from '@/types/namespace';
import { IApiResult } from '@/types/base';
let axios = request;

class NamespaceApi {
  queryList(): Promise<AxiosResponse<IApiResult<Array<INamespace>>>> {
    return axios.request({
      method: 'get',
      url: '/ratchjob/api/console/v1/namespace/list'
    });
  }
  add(namespace: INamespace): Promise<AxiosResponse<IApiResult<any>>> {
    return axios.requestJSON({
      method: 'post',
      url: '/ratchjob/api/console/v1/namespace/create',
      data: {
        ...namespace
      }
    });
  }
  update(namespace: INamespace): Promise<AxiosResponse<IApiResult<any>>> {
    return axios.requestJSON({
      method: 'post',
      url: '/ratchjob/api/console/v1/namespace/update',
      data: {
        ...namespace
      }
    });
  }
  delete(namespace: INamespace): Promise<AxiosResponse<IApiResult<any>>> {
    return axios.requestJSON({
      method: 'post',
      url: '/ratchjob/api/console/v1/namespace/remove',
      data: {
        namespaceId: namespace.namespaceId
      }
    });
  }
}
const namespaceApi = new NamespaceApi();
export default namespaceApi;
