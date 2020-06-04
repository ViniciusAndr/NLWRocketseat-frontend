import React, { useEffect, useState, ChangeEvent, FormEvent} from 'react';
import logo from '../../assets/logo.svg';
import api from '../../services/api';
import ibge from '../../services/ibge';
import { LeafletMouseEvent } from 'leaflet';
import { Link, useHistory} from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker} from 'react-leaflet';

import './styles.css';

const CreatePoint = () => {

    const history = useHistory();

    //Quando criar um state pra array ou objeto precisa dizer o tipo manualmente
    interface ItemObject{
        id: number;
        name: string;
        image_url: string;
    }

    interface Uf{
        id: number;
        sigla: string;
        nome: string;
    }

    interface City{
        id: number;
        nome: string;
    }

    const [items, setItems] = useState<ItemObject[]>([]);
    const [ufs, setUfs] = useState<Uf[]>([]);
    const [cities, setCities] = useState<City[]>([]);

    const [selectedUf, setSelectedUf] = useState("0");
    const [selectedCity, setSelectedCity] = useState(0);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0]);

    const [formData, setFormData] = useState({
        name: '',
        email:'',
        whatsapp: '',
    });

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude} = position.coords;
            setInitialPosition([latitude, longitude]);
        });
    }, [])

    useEffect(() => {
        api.get('items')
            .then( res => {
                setItems(res.data);
            })
            .catch(err => {
                console.log('Não foi possivel obter os items, verifique a API de consulta.')
            })
    }, [])

    useEffect(() => {
        ibge.get('estados')
            .then( res => {
                setUfs(res.data);
            })
            .catch(err => {
                console.log('Não foi possivel obter os items, verifique a API de consulta.')
            })
    }, [])

    useEffect(() => {
        ibge.get(`estados/${selectedUf}/municipios`)
            .then( res => {
                setCities(res.data);
            })
            .catch(err => {
                console.log('Não foi possivel obter os items, verifique a API de consulta.')
            })
    }, [selectedUf])

    function handleSelectUf(e:ChangeEvent<HTMLSelectElement>){
        setSelectedUf(e.target.value);
    }

    function handleSelectCity(e:ChangeEvent<HTMLSelectElement>){
        console.log(e.target.value);
        setSelectedCity(Number(e.target.value));
    }

    function handleFormData(e:ChangeEvent<HTMLInputElement>){
        const { name, value } = e.target;
        setFormData({...formData, [name]:value});
    }

    function handleMapClick(e:LeafletMouseEvent){
        setSelectedPosition([
            e.latlng.lat,
            e.latlng.lng
        ]);
    }

    function handleSelectItem(id: number){
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if(alreadySelected >= 0){
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);
        }else{
            setSelectedItems([...selectedItems, id]);
        }
    }

    async function handleSubmit(e:FormEvent){
        e.preventDefault();

        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [ latitude, longitude ] = selectedPosition;
        const items = selectedItems;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        }

        console.log(data);

        await api.post('points', data)
        .then(() => {
            alert('Ponto de coleta criado.')
        })
        .catch((e)=>{
            alert('Ocorreu um problema ao criar o ponto de coleta.')
        });

        history.push('/');
    }

    return(
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
                <Link to='/'>
                    <FiArrowLeft></FiArrowLeft>
                    Voltar pra home
                </Link>
            </header>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/>ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name" id="name" onChange={handleFormData}/>
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="email" name="email" id="email" onChange={handleFormData}/>
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={handleFormData}/>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} Onclick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition}/>
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" value={selectedUf} onChange={handleSelectUf}>
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf=> (
                                    <option key={uf.id} value={uf.sigla}>{uf.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city=> (
                                    <option key={city.id} value={city.nome}>{city.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coletas</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(item=> (
                            <li className={selectedItems.includes(item.id) ? 'selected' : ''} key={item.id} onClick={() => handleSelectItem(item.id)}>
                                <img src={item.image_url} alt={item.name} />
                                <span>{item.name}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>
                <button type='submit'>
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
    );
};

export default CreatePoint;